import React, { useState, useEffect, useMemo } from 'react';
import {
  storeOrderService,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  formatCurrencyBRL,
  type StoreOrder,
} from '../../services/storeOrderService';
import { ShippingModal } from '../../features/store/ShippingModal';
import { StoreOrderDetailModal } from '../../features/store/StoreOrderDetail';

type FilterStatus =
  | 'ALL'
  | 'PENDING_SHIPMENT'
  | 'IN_TRANSIT'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'POST_SALE';

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const response = (err as { response?: { data?: { error?: string; detail?: string } } }).response;
    return response?.data?.error || response?.data?.detail || fallback;
  }
  return fallback;
}

export function OrdersTab() {
  const [allOrders, setAllOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  // Filtros
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [appliedSearch, setAppliedSearch] = useState<string>('');

  // Modais
  const [shippingModalOrder, setShippingModalOrder] = useState<StoreOrder | null>(null);
  const [detailModalOrder, setDetailModalOrder] = useState<StoreOrder | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<StoreOrder | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [bannerFeedback, setBannerFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchAllOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const ordersData = await storeOrderService.getOrders('ALL');
        if (active) {
          setAllOrders(ordersData);
        }
      } catch {
        if (active) {
          setError('Não foi possível sincronizar os pedidos da loja no momento.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchAllOrders();
    return () => {
      active = false;
    };
  }, [refreshTick]);

  const summary = useMemo(() => {
    let awaiting_shipment = 0;
    let delayed_count = 0;
    let in_transit = 0;
    let completed_count = 0;
    let cancelled_count = 0;

    for (const o of allOrders) {
      if (o.status === 'PAID' || o.status === 'PROCESSING') {
        awaiting_shipment += 1;
        if (o.urgency_status === 'DELAYED' || o.is_delayed) {
          delayed_count += 1;
        }
      } else if (o.status === 'SHIPPED') {
        in_transit += 1;
      } else if (o.status === 'DELIVERED') {
        completed_count += 1;
      } else if (o.status === 'CANCELLED' || o.status === 'REFUNDED') {
        cancelled_count += 1;
      }
    }

    return {
      awaiting_shipment,
      delayed_count,
      in_transit,
      completed_count,
      cancelled_count,
    };
  }, [allOrders]);

  const filteredOrders = useMemo(() => {
    const query = appliedSearch.toLowerCase();

    return allOrders.filter((order) => {
      if (activeFilter === 'PENDING_SHIPMENT') {
        if (order.status !== 'PENDING' && order.status !== 'PAID' && order.status !== 'PROCESSING') {
          return false;
        }
      } else if (activeFilter === 'IN_TRANSIT') {
        if (order.status !== 'SHIPPED') return false;
      } else if (activeFilter === 'COMPLETED') {
        if (order.status !== 'DELIVERED') return false;
      } else if (activeFilter === 'CANCELLED') {
        if (order.status !== 'CANCELLED' && order.status !== 'REFUNDED') return false;
      } else if (activeFilter === 'POST_SALE') {
        const hasPendingReturns =
          order.return_requests && order.return_requests.length > 0;
        if (
          order.status !== 'CANCEL_REQUESTED' &&
          order.status !== 'DELIVERY_DISPUTED' &&
          !hasPendingReturns
        ) {
          return false;
        }
      }

      if (query) {
        const idStr = String(order.id);
        const codeStr = (order.code || '').toLowerCase();
        const customerStr = (order.customer_name || '').toLowerCase();
        const itemMatch = order.items?.some((item) =>
          item.product_name.toLowerCase().includes(query),
        );
        if (
          !idStr.includes(query.replace('#', '')) &&
          !codeStr.includes(query) &&
          !customerStr.includes(query) &&
          !itemMatch
        ) {
          return false;
        }
      }

      return true;
    });
  }, [allOrders, activeFilter, appliedSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchQuery.trim());
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setAppliedSearch('');
  };

  const handleMoveToProcessing = async (orderId: number) => {
    try {
      setActionLoadingId(orderId);
      setError(null);
      await storeOrderService.updateOrderStatus(orderId, 'PROCESSING');
      setBannerFeedback(`Pedido #${orderId} movido para separação.`);
      setRefreshTick((t) => t + 1);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Erro ao iniciar separação do pedido.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleShipConfirm = async (carrier: string, trackingCode: string) => {
    if (!shippingModalOrder) return;
    try {
      setActionLoadingId(shippingModalOrder.id);
      setError(null);
      await storeOrderService.shipOrder(shippingModalOrder.id, {
        carrier,
        tracking_code: trackingCode,
      });
      setBannerFeedback(`Pedido #${shippingModalOrder.id} despachado com sucesso.`);
      setShippingModalOrder(null);
      setRefreshTick((t) => t + 1);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Erro ao despachar pedido.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeliverConfirm = async (orderId: number) => {
    try {
      setActionLoadingId(orderId);
      setError(null);
      await storeOrderService.markDelivered(orderId);
      setBannerFeedback(`Entrega do pedido #${orderId} confirmada.`);
      setRefreshTick((t) => t + 1);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Erro ao confirmar entrega do pedido.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalOrder) return;
    if (cancelReason.trim().length < 5) {
      setCancelError('Informe o motivo do cancelamento (mínimo de 5 caracteres).');
      return;
    }

    try {
      setActionLoadingId(cancelModalOrder.id);
      setCancelError(null);
      await storeOrderService.cancelOrder(cancelModalOrder.id, cancelReason.trim());
      setBannerFeedback(`Pedido #${cancelModalOrder.id} cancelado e estoque restaurado.`);
      setCancelModalOrder(null);
      setCancelReason('');
      setRefreshTick((t) => t + 1);
    } catch (err: unknown) {
      setCancelError(getApiErrorMessage(err, 'Erro ao cancelar o pedido.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOrderUpdatedFromModal = (updated: StoreOrder) => {
    setAllOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setDetailModalOrder(updated);
  };

  return (
    <div className="space-y-6">
      {/* KPIs de Logística e Pós-Venda */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <button
          type="button"
          onClick={() => setActiveFilter('PENDING_SHIPMENT')}
          className={`text-left bg-white p-5 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'PENDING_SHIPMENT'
              ? 'border-[#354B5E] ring-2 ring-[#354B5E]/10'
              : 'border-[#EFEBDD] hover:border-[#DCD6C8]'
          } shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-4`}
        >
          <div className="w-12 h-12 rounded-xl bg-[#FAF3EE] border border-[#EED9CE] flex items-center justify-center text-[#A24726] shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C857B]">
              Aguardando Envio
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h4 className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold text-[#1A1A1A]">
                {loading ? '—' : summary.awaiting_shipment}
              </h4>
              {!loading && summary.delayed_count > 0 && (
                <span className="text-[11px] font-bold text-[#9E2A2B] bg-[#FCECEC] px-2 py-0.5 rounded-full">
                  {summary.delayed_count} em atraso
                </span>
              )}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('IN_TRANSIT')}
          className={`text-left bg-white p-5 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'IN_TRANSIT'
              ? 'border-[#354B5E] ring-2 ring-[#354B5E]/10'
              : 'border-[#EFEBDD] hover:border-[#DCD6C8]'
          } shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-4`}
        >
          <div className="w-12 h-12 rounded-xl bg-[#EEF3F7] border border-[#CBD8E3] flex items-center justify-center text-[#354B5E] shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 17a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4zM3 5h11v10H3V5zm11 3h4l3 4v3h-7V8z" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C857B]">
              Em Trânsito
            </p>
            <h4 className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold text-[#1A1A1A] mt-0.5">
              {loading ? '—' : summary.in_transit}
            </h4>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('COMPLETED')}
          className={`text-left bg-white p-5 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'COMPLETED'
              ? 'border-[#354B5E] ring-2 ring-[#354B5E]/10'
              : 'border-[#EFEBDD] hover:border-[#DCD6C8]'
          } shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-4`}
        >
          <div className="w-12 h-12 rounded-xl bg-[#EAF3E6] border border-[#B8D4AE] flex items-center justify-center text-[#3A6B2E] shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C857B]">
              Entregues
            </p>
            <h4 className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold text-[#1A1A1A] mt-0.5">
              {loading ? '—' : summary.completed_count}
            </h4>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('CANCELLED')}
          className={`text-left bg-white p-5 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'CANCELLED'
              ? 'border-[#354B5E] ring-2 ring-[#354B5E]/10'
              : 'border-[#EFEBDD] hover:border-[#DCD6C8]'
          } shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-4`}
        >
          <div className="w-12 h-12 rounded-xl bg-[#F4F1EA] border border-[#DCD6C8] flex items-center justify-center text-[#6E685F] shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C857B]">
              Cancelados / Estornados
            </p>
            <h4 className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold text-[#1A1A1A] mt-0.5">
              {loading ? '—' : summary.cancelled_count}
            </h4>
          </div>
        </button>
      </div>

      {/* Feedback de Sucesso / Erro */}
      {bannerFeedback && (
        <div className="p-4 rounded-2xl bg-[#EAF3E6] border border-[#B8D4AE] text-[#2E5425] text-sm font-medium flex items-center justify-between">
          <span>{bannerFeedback}</span>
          <button
            type="button"
            onClick={() => setBannerFeedback(null)}
            className="text-xs font-bold underline ml-4 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-[#FCECEC] border border-[#E8B8B8] text-[#9E2A2B] text-sm font-medium flex items-center justify-between"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs font-bold underline ml-4 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Barra de Filtros + Busca */}
      <div className="bg-white rounded-2xl border border-[#EFEBDD] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'ALL', label: 'Todos os Pedidos' },
              { id: 'PENDING_SHIPMENT', label: 'Para Despachar' },
              { id: 'IN_TRANSIT', label: 'Em Trânsito' },
              { id: 'POST_SALE', label: 'Pós-Venda / Solicitações' },
              { id: 'COMPLETED', label: 'Concluídos' },
              { id: 'CANCELLED', label: 'Cancelados' },
            ] as { id: FilterStatus; label: string }[]
          ).map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#354B5E] text-white shadow-2xs'
                    : 'text-[#5A554E] hover:bg-[#FAF8F5] hover:text-[#1A1A1A]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-72">
            <svg
              className="w-4 h-4 text-[#8C857B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Buscar por #ID, cliente ou perfume..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#FAF8F5] border border-[#E2DEC9] text-xs font-medium text-[#1A1A1A] placeholder-[#8C857B] focus:outline-none focus:border-[#354B5E] focus:bg-white transition-all"
            />
            {(searchQuery || appliedSearch) && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Limpar busca"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8C857B] hover:text-[#1A1A1A] cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#DCD6C8] text-xs font-semibold text-[#354B5E] hover:bg-[#EFEBDD] transition-colors cursor-pointer shrink-0"
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Tabela de Pedidos */}
      <div className="bg-white rounded-2xl border border-[#EFEBDD] shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto orders-table-container">
          <table className="w-full min-w-[760px] text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] text-[#6E685F] text-[10.5px] uppercase tracking-wider border-b border-[#EFEBDD]">
                <th className="py-2.5 pl-3.5 pr-1.5 font-bold">Pedido & Data</th>
                <th className="py-2.5 px-2 font-bold">Cliente</th>
                <th className="py-2.5 px-2 font-bold">Itens Adquiridos</th>
                <th className="py-2.5 px-2 font-bold">Pagamento & Total</th>
                <th className="py-2.5 px-2 font-bold text-center">Prazo de Despacho</th>
                <th className="py-2.5 px-2 font-bold text-center">Status</th>
                <th className="py-2.5 pl-1.5 pr-3.5 font-bold text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EFE6] text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-[#8C857B]">
                    <div className="w-6 h-6 border-2 border-[#354B5E] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Carregando pedidos da vitrine...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <div className="max-w-sm mx-auto space-y-1.5">
                      <div className="w-10 h-10 rounded-full bg-[#FAF8F5] border border-[#EFEBDD] flex items-center justify-center mx-auto text-[#8C857B]">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <p className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#1A1A1A]">
                        Nenhum pedido encontrado
                      </p>
                      <p className="text-xs text-[#8C857B]">
                        Não há pedidos correspondentes aos filtros ou termos pesquisados.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusMeta =
                    ORDER_STATUS_STYLES[order.status] || ORDER_STATUS_STYLES.PENDING;
                  const statusLabel = ORDER_STATUS_LABELS[order.status] || order.status;
                  const itemsCount =
                    order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
                  const firstItem = order.items?.[0];
                  const extraItemsCount = (order.items?.length || 0) - 1;
                  const discountVal = Number(order.discount_amount || 0);
                  const hasReturnRequest = Boolean(
                    order.return_requests &&
                      order.return_requests.some(
                        (r) => r.status === 'REQUESTED' || r.status === 'APPROVED',
                      ),
                  );

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setDetailModalOrder(order)}
                      className="hover:bg-[#FAF8F5]/90 transition-colors cursor-pointer group"
                    >
                      {/* Pedido & Data */}
                      <td className="py-2.5 pl-3.5 pr-1.5 align-middle whitespace-nowrap">
                        <span className="font-['Plus_Jakarta_Sans'] font-bold text-[12.5px] text-[#354B5E] group-hover:underline">
                          #{order.code || order.id}
                        </span>
                        <span className="block text-[10px] text-[#8C857B] mt-0.5">
                          {new Date(order.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>

                      {/* Cliente */}
                      <td className="py-2.5 px-2 align-middle">
                        <p className="font-semibold text-[#1A1A1A] text-[12px] truncate max-w-28 xl:max-w-36">
                          {order.customer_name || 'Cliente NŌTA'}
                        </p>
                        {order.shipping_service ? (
                          <span className="block text-[10px] text-[#6E685F] mt-0.5 truncate max-w-28 xl:max-w-36">
                            Frete: {order.shipping_service}
                          </span>
                        ) : order.customer_email ? (
                          <span className="block text-[10px] text-[#8C857B] truncate max-w-28 xl:max-w-36">
                            {order.customer_email}
                          </span>
                        ) : null}
                      </td>

                      {/* Itens Adquiridos */}
                      <td className="py-2.5 px-2 align-middle">
                        {firstItem ? (
                          <div className="max-w-36 xl:max-w-44">
                            <p
                              className="text-[11.5px] font-semibold text-[#1A1A1A] truncate"
                              title={`${firstItem.quantity}x ${firstItem.product_name}`}
                            >
                              {firstItem.quantity}x {firstItem.product_name}
                              {firstItem.volume_ml ? ` (${firstItem.volume_ml}ml)` : ''}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] text-[#6E685F] whitespace-nowrap">
                                {itemsCount} {itemsCount === 1 ? 'un.' : 'uns.'}
                              </span>
                              {extraItemsCount > 0 && (
                                <span className="text-[9.5px] font-bold px-1 py-0.2 rounded bg-[#FAF8F5] border border-[#E2DEC9] text-[#354B5E] whitespace-nowrap">
                                  +{extraItemsCount}{' '}
                                  {extraItemsCount === 1 ? 'item' : 'itens'}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#8C857B]">Ver ficha</span>
                        )}
                      </td>

                      {/* Pagamento & Total */}
                      <td className="py-2.5 px-2 align-middle whitespace-nowrap">
                        <p className="font-['Plus_Jakarta_Sans'] font-bold text-[12.5px] text-[#1A1A1A]">
                          {formatCurrencyBRL(order.total_amount)}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span
                            className={`inline-block text-[9.5px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                              order.payment_method === 'CREDIT_CARD' || order.payment_method_label?.includes('Cartão')
                                ? 'bg-[#EEF3F7] border-[#CBD8E3] text-[#354B5E]'
                                : 'bg-[#FAF8F5] border-[#E2DEC9] text-[#4A4640]'
                            }`}
                          >
                            {order.payment_method === 'CREDIT_CARD' || order.payment_method_label?.includes('Cartão')
                              ? 'Cartão'
                              : order.payment_method_label || 'PIX'}
                          </span>
                          {discountVal > 0 && (
                            <span
                              title={`Desconto: ${formatCurrencyBRL(discountVal)}`}
                              className="text-[9.5px] font-bold text-[#5C6B4E] bg-[#F0F4EC] px-1 py-0.5 rounded border border-[#CED9C4]"
                            >
                              {order.coupon_code || 'Cupom'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Prazo de Despacho */}
                      <td className="py-2.5 px-2 align-middle text-center whitespace-nowrap">
                        {order.urgency_status &&
                        (order.status === 'PAID' || order.status === 'PROCESSING') ? (
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                order.urgency_status === 'DELAYED'
                                ? 'bg-[#FCECEC] text-[#9E2A2B] border-[#E8B8B8]'
                                : order.urgency_status === 'DUE_TODAY'
                                ? 'bg-[#FBF3E4] text-[#8B6220] border-[#E8D5B0]'
                                : 'bg-[#EAF3E6] text-[#2E5425] border-[#B8D4AE]'
                              }`}
                            >
                              {order.urgency_status === 'DELAYED'
                                ? 'Em atraso'
                                : order.urgency_status === 'DUE_TODAY'
                                ? 'Enviar hoje'
                                : 'No prazo'}
                            </span>
                            {order.dispatch_deadline && (
                              <span className="block text-[10px] text-[#6E685F] mt-0.5">
                                Até{' '}
                                {new Date(order.dispatch_deadline).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                        ) : order.tracking_code ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="font-mono text-[10px] font-bold text-[#354B5E] bg-[#EEF3F7] px-1.5 py-0.5 rounded border border-[#CBD8E3]">
                              {order.tracking_code}
                            </span>
                            {order.carrier && (
                              <span className="block text-[10px] text-[#6E685F] mt-0.5">
                                {order.carrier}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#8C857B]">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-2 align-middle text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                          {order.status === 'PAID'
                            ? 'Aprovado'
                            : order.status === 'CANCEL_REQUESTED'
                            ? 'Cancelamento'
                            : order.status === 'DELIVERY_DISPUTED'
                            ? 'Contestado'
                            : statusLabel}
                        </span>
                      </td>

                      {/* Ações */}
                      <td
                        className="py-2.5 pl-1.5 pr-3.5 align-middle text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-center gap-1">
                          {order.status === 'PAID' && (
                            <>
                              <button
                                type="button"
                                disabled={actionLoadingId === order.id}
                                onClick={() => handleMoveToProcessing(order.id)}
                                className="px-2 py-1 rounded-md bg-[#354B5E] text-white text-[10.5px] font-semibold hover:bg-[#283A49] transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {actionLoadingId === order.id ? '...' : 'Separar'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCancelError(null);
                                  setCancelReason('');
                                  setCancelModalOrder(order);
                                }}
                                className="px-2 py-1 rounded-md bg-white border border-[#E8B8B8] text-[#9E2A2B] text-[10.5px] font-semibold hover:bg-[#FCECEC] transition-colors cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </>
                          )}

                          {order.status === 'PROCESSING' && (
                            <>
                              <button
                                type="button"
                                onClick={() => setShippingModalOrder(order)}
                                className="px-2 py-1 rounded-md bg-[#354B5E] text-white text-[10.5px] font-semibold hover:bg-[#283A49] transition-colors cursor-pointer"
                              >
                                Despachar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCancelError(null);
                                  setCancelReason('');
                                  setCancelModalOrder(order);
                                }}
                                className="px-2 py-1 rounded-md bg-white border border-[#E8B8B8] text-[#9E2A2B] text-[10.5px] font-semibold hover:bg-[#FCECEC] transition-colors cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </>
                          )}

                          {order.status === 'SHIPPED' && (
                            <button
                              type="button"
                              disabled={actionLoadingId === order.id}
                              onClick={() => handleDeliverConfirm(order.id)}
                              className="px-2 py-1 rounded-md bg-[#5C6B4E] text-white text-[10.5px] font-semibold hover:bg-[#49563D] transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {actionLoadingId === order.id ? '...' : 'Entregue'}
                            </button>
                          )}

                          {(order.status === 'CANCEL_REQUESTED' ||
                            order.status === 'DELIVERY_DISPUTED' ||
                            hasReturnRequest) && (
                            <button
                              type="button"
                              onClick={() => setDetailModalOrder(order)}
                              className="px-2 py-1 rounded-md bg-[#A24726] text-white text-[10.5px] font-semibold hover:bg-[#87381C] transition-colors cursor-pointer"
                            >
                              Analisar
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setDetailModalOrder(order)}
                            className="px-2 py-1 rounded-md bg-[#FAF8F5] border border-[#E2DEC9] text-[#354B5E] text-[10.5px] font-semibold hover:bg-[#EFEBDD] transition-colors cursor-pointer"
                          >
                            Ver Ficha
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Despacho Rápido */}
      {shippingModalOrder !== null && (
        <ShippingModal
          order={shippingModalOrder}
          isSubmitting={actionLoadingId === shippingModalOrder.id}
          onCancel={() => setShippingModalOrder(null)}
          onSubmit={handleShipConfirm}
        />
      )}

      {/* Modal de Cancelamento Rápido pela Loja */}
      {cancelModalOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
          onClick={() => setCancelModalOrder(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#FAF8F5] border border-[#E2DEC9] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-white border-b border-[#EFEBDD] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#9E2A2B]">
                  Ação de Estorno
                </span>
                <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#1A1A1A]">
                  Cancelar Pedido #{cancelModalOrder.code || cancelModalOrder.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="text-sm text-[#6E685F] hover:text-[#1A1A1A] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmCancelOrder} className="p-6 space-y-4">
              {cancelError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-[#FCECEC] border border-[#E8B8B8] text-xs font-medium text-[#9E2A2B]"
                >
                  {cancelError}
                </div>
              )}

              <p className="text-xs text-[#5A554E] bg-white p-3.5 rounded-xl border border-[#EFEBDD]">
                Ao cancelar este pedido de <strong>{cancelModalOrder.customer_name}</strong> (
                {formatCurrencyBRL(cancelModalOrder.total_amount)}), as unidades reservadas voltarão
                automaticamente ao estoque da sua loja.
              </p>

              <div>
                <label
                  htmlFor="seller-cancel-reason"
                  className="block text-xs font-bold uppercase tracking-wider text-[#5A554E] mb-2"
                >
                  Motivo do Cancelamento
                </label>
                <textarea
                  id="seller-cancel-reason"
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Informe o motivo que será registrado no histórico do pedido..."
                  className="w-full rounded-xl border border-[#DCD6C8] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] focus:border-[#354B5E] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#EFEBDD]">
                <button
                  type="button"
                  onClick={() => setCancelModalOrder(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#5A554E] bg-white border border-[#DCD6C8] rounded-xl hover:bg-[#F4F1EA] cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === cancelModalOrder.id}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#9E2A2B] rounded-xl hover:bg-[#7E2021] disabled:opacity-50 cursor-pointer"
                >
                  {actionLoadingId === cancelModalOrder.id
                    ? 'Cancelando...'
                    : 'Confirmar Cancelamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Completo de Ficha do Pedido (Itens, Valores, Forma de Pagamento, Pós-Venda) */}
      <StoreOrderDetailModal
        orderId={detailModalOrder ? detailModalOrder.id : null}
        initialOrder={detailModalOrder}
        onClose={() => setDetailModalOrder(null)}
        onOrderUpdated={handleOrderUpdatedFromModal}
      />
    </div>
  );
}
