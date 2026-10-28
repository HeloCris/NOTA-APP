import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  storeOrderService,
  type StoreOrder,
  type OrderStatusHistoryItem,
  type ReturnRequest,
} from '../../services/storeOrderService';

export const StoreOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionReason, setActionReason] = useState<string>('');

  // Estados para Despacho
  const [carrier, setCarrier] = useState<string>('');
  const [trackingCode, setTrackingCode] = useState<string>('');
  const [showDispatchForm, setShowDispatchForm] = useState<boolean>(false);

  // Estados para Reenvio em Contestação
  const [resendModalVisible, setResendModalVisible] = useState<boolean>(false);
  const [newCarrier, setNewCarrier] = useState<string>('');
  const [newTrackingCode, setNewTrackingCode] = useState<string>('');

  // Estados para Devolução e Reestocagem (resellable)
  const [receiptModalVisible, setReceiptModalVisible] = useState<boolean>(false);
  const [selectedReturnId, setSelectedReturnId] = useState<number | null>(null);
  const [isResellable, setIsResellable] = useState<boolean>(true);

  const loadOrder = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await storeOrderService.getOrderDetail(id);
      setOrder(data);
    } catch (err) {
      console.error('Erro ao carregar o pedido', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const formatMoney = (val?: string | number): string => {
    const num = typeof val === 'number' ? val : parseFloat(val || '0');
    return isNaN(num)
      ? 'R$ 0,00'
      : num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Ação: Despachar Pedido (PAID / PROCESSING -> SHIPPED)
  const handleDispatchOrder = async () => {
    if (!order || !carrier.trim() || !trackingCode.trim()) {
      alert('Informe a transportadora e o código de rastreio.');
      return;
    }
    try {
      setActionLoading(true);
      await storeOrderService.shipOrder(order.id, {
        carrier: carrier.trim(),
        tracking_code: trackingCode.trim(),
      });
      setShowDispatchForm(false);
      setCarrier('');
      setTrackingCode('');
      await loadOrder();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao despachar o pedido.');
    } finally {
      setActionLoading(false);
    }
  };

  // Ação: Reenviar Pedido Contested com Novo Rastreio
  const handleResendDisputedOrder = async () => {
    if (!order || !newTrackingCode.trim()) {
      alert('Informe o novo código de rastreio para o reenvio.');
      return;
    }
    try {
      setActionLoading(true);
      await storeOrderService.resolveDispute(order.id, 'reship', newTrackingCode.trim());
      alert('Pedido reenviado com sucesso! Status alterado para ENVIADO.');
      setResendModalVisible(false);
      setNewTrackingCode('');
      setNewCarrier('');
      await loadOrder();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao reenviar o pedido.');
    } finally {
      setActionLoading(false);
    }
  };

  // Ação: Aprovar Solicitação de Devolução
  const handleApproveReturn = async (returnId: number) => {
    if (!window.confirm('Deseja aprovar esta solicitação de devolução?')) return;
    try {
      setActionLoading(true);
      await storeOrderService.processReturn(returnId, 'approve');
      await loadOrder();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao aprovar a devolução.');
    } finally {
      setActionLoading(false);
    }
  };

  // Ação: Confirmar Recebimento Físico e Reestocagem (resellable)
  const handleConfirmReturnReceipt = async () => {
    if (!selectedReturnId) return;
    try {
      setActionLoading(true);
      await storeOrderService.processReturn(selectedReturnId, 'receive', {
        resellable: isResellable,
      });
      setReceiptModalVisible(false);
      setSelectedReturnId(null);
      await loadOrder();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao processar o recebimento.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-600">Carregando detalhes do pedido...</div>;
  }

  if (!order) {
    return <div className="p-6 text-red-600 font-semibold">Pedido não encontrado.</div>;
  }

  // Tratamento do endereço de entrega
  const address = order.shipping_address as Record<string, any> | null;
  const street = address?.shipping_street || address?.street || '';
  const number = address?.shipping_number || address?.number || '';
  const neighborhood = address?.shipping_neighborhood || address?.neighborhood || '';
  const city = address?.shipping_city || address?.city || '';
  const state = address?.shipping_state || address?.state || address?.stateUf || address?.state_uf || '';
  const zipCode = address?.shipping_zip_code || address?.cep || address?.zip_code || '';

  // Lista de solicitações de devolução
  const returnRequests: ReturnRequest[] = order.return_requests || [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Pedido #{order.code || order.id}
          </h1>
          <p className="text-gray-500 text-sm">Cliente: {order.customer_name}</p>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
          {order.status}
        </span>
      </div>

      {/* Alerta de Endereço Alterado */}
      {order.address_changed && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-md">
          <p className="font-bold text-yellow-800 text-sm">
            ⚠️ Endereço alterado pelo cliente
          </p>
        </div>
      )}

      {/* Alerta de Contestação do Cliente */}
      {order.status === 'DELIVERY_DISPUTED' && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md space-y-1">
          <p className="font-bold text-red-800 text-sm">
            🚨 Contestação Registrada: O cliente informou que NÃO recebeu o pedido.
          </p>
          <p className="text-xs text-red-700">
            Escolha abaixo se deseja reenviar com novo rastreio ou realizar o reembolso.
          </p>
        </div>
      )}

      {/* Seção de Devoluções de Produtos */}
      {returnRequests.length > 0 && (
        <div className="border border-orange-200 bg-orange-50/50 rounded-lg p-5 space-y-4">
          <h2 className="text-base font-bold text-orange-900 flex items-center gap-2">
            📦 Solicitações de Devolução
          </h2>

          {returnRequests.map((ret: ReturnRequest) => (
            <div key={ret.id} className="bg-white p-4 rounded-md border border-orange-200 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Motivo: <span className="font-normal">{ret.reason}</span>
                  </p>
                  {ret.description ? (
                    <p className="text-xs text-gray-600 mt-1">Obs: {ret.description}</p>
                  ) : null}
                </div>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-100 text-gray-700">
                  {ret.status}
                </span>
              </div>

              <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded">
                <p className="font-semibold mb-1">Itens solicitados:</p>
                {(ret.items || []).map((item) => (
                  <p key={item.id}>
                    • {item.product_name || `Item #${item.order_item}`} — Quantidade: {item.quantity}
                  </p>
                ))}
              </div>

              {/* Botões de Ação para o Lojista */}
              <div className="flex justify-end gap-2 pt-1">
                {(ret.status === 'REQUESTED') && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleApproveReturn(ret.id)}
                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1.5 rounded font-semibold transition-colors"
                  >
                    Aprovar Devolução
                  </button>
                )}

                {ret.status === 'APPROVED' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => {
                      setSelectedReturnId(ret.id);
                      setReceiptModalVisible(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded font-semibold transition-colors"
                  >
                    Confirmar Produto Recebido
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Itens do Pedido */}
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">Itens do Pedido</h2>
        <div className="divide-y">
          {(order.items || []).map((item) => {
            const unitPriceNum =
              typeof item.unit_price === 'number'
                ? item.unit_price
                : parseFloat(item.unit_price || '0');

            const totalPrice = item.total_price
              ? typeof item.total_price === 'number'
                ? item.total_price
                : parseFloat(item.total_price)
              : unitPriceNum * item.quantity;

            return (
              <div
                key={item.id}
                className="py-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-gray-800">{item.product_name}</p>
                  <p className="text-sm text-gray-500">
                    Qtd: {item.quantity} x {formatMoney(item.unit_price)}
                  </p>
                </div>
                <p className="font-semibold text-gray-900">{formatMoney(totalPrice)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Endereço e Rastreio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 bg-white shadow-sm space-y-1">
          <h2 className="text-lg font-semibold mb-2 text-gray-800">Endereço de Entrega</h2>
          {address ? (
            <div className="text-sm text-gray-700 space-y-0.5">
              <p>
                {street}
                {number ? `, ${number}` : ''}
              </p>
              <p>
                {neighborhood}
                {city ? ` - ${city}` : ''}
                {state ? `/${state}` : ''}
              </p>
              <p className="text-gray-500">CEP: {zipCode}</p>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Endereço não informado.</p>
          )}
        </div>

        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-2 text-gray-800">Rastreio</h2>
          {order.tracking_code ? (
            <div className="text-sm space-y-1">
              <p>
                Transportadora:{' '}
                <span className="font-semibold text-gray-800">{order.carrier || 'N/A'}</span>
              </p>
              <p>
                Código:{' '}
                <span className="font-mono font-bold text-gray-900">
                  {order.tracking_code}
                </span>
              </p>
              {order.carrier_url && (
                <a
                  href={`${order.carrier_url}${order.tracking_code}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-blue-600 hover:underline font-medium text-xs"
                >
                  Rastrear no site da transportadora &rarr;
                </a>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Sem rastreio cadastrado</p>
          )}
        </div>
      </div>

      {/* Ações Disponíveis */}
      <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Ações Disponíveis</h2>

        {/* Despachar Pedido */}
        {['PAID', 'PROCESSING'].includes(order.status) && (
          <div className="space-y-3">
            {!showDispatchForm ? (
              <button
                onClick={() => setShowDispatchForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
              >
                Despachar Pedido
              </button>
            ) : (
              <div className="bg-white p-3 border rounded-md space-y-2 max-w-md">
                <p className="text-xs font-bold text-gray-700">Dados da Transportadora</p>
                <input
                  type="text"
                  placeholder="Nome da Transportadora (ex: Correios)"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full border p-2 text-xs rounded"
                />
                <input
                  type="text"
                  placeholder="Código de Rastreio"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="w-full border p-2 text-xs rounded"
                />
                <div className="flex gap-2">
                  <button
                    disabled={actionLoading}
                    onClick={handleDispatchOrder}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-semibold"
                  >
                    Confirmar Envio
                  </button>
                  <button
                    onClick={() => setShowDispatchForm(false)}
                    className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-xs"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Responder Cancelamento Solicitado pelo Cliente */}
        {order.status === 'CANCEL_REQUESTED' && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg space-y-3 max-w-md">
            <p className="font-bold text-yellow-800 text-sm">
              ⚠️ O cliente solicitou o cancelamento deste pedido.
            </p>

            <input
              type="text"
              placeholder="Motivo (obrigatório em caso de recusa)"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="border border-yellow-300 p-2 rounded text-sm w-full bg-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
            />

            <div className="flex gap-2 pt-1">
              <button
                disabled={actionLoading}
                onClick={async () => {
                  try {
                    setActionLoading(true);
                    await storeOrderService.respondCancelRequest(order.id, true);
                    alert('Solicitação de cancelamento APROVADA com sucesso.');
                    await loadOrder();
                  } catch (err: any) {
                    alert(err?.response?.data?.error || err?.response?.data?.detail || 'Erro ao aprovar cancelamento.');
                  } finally {
                    setActionLoading(false);
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
              >
                Aprovar Cancelamento
              </button>

              <button
                disabled={actionLoading}
                onClick={async () => {
                  if (!actionReason.trim()) {
                    alert('Atenção: Informe o motivo da recusa do cancelamento.');
                    return;
                  }
                  try {
                    setActionLoading(true);
                    await storeOrderService.respondCancelRequest(order.id, false, actionReason.trim());
                    alert('Solicitação de cancelamento RECUSADA. O pedido retornou para Em Separação (PROCESSING).');
                    setActionReason('');
                    await loadOrder();
                  } catch (err: any) {
                    alert(err?.response?.data?.error || err?.response?.data?.detail || 'Erro ao recusar cancelamento.');
                  } finally {
                    setActionLoading(false);
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
              >
                Recusar Cancelamento
              </button>
            </div>
          </div>
        )}

        {/* Marcar como Entregue pelo Lojista */}
        {order.status === 'SHIPPED' && (
          <button
            disabled={actionLoading}
            onClick={() =>
              storeOrderService.markDelivered(order.id).then(loadOrder)
            }
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
          >
            Marcar como Entregue
          </button>
        )}

        {/* Resolver Contestação ("Não Recebi") */}
        {order.status === 'DELIVERY_DISPUTED' && (
          <div className="flex gap-2">
            <button
              disabled={actionLoading}
              onClick={() => {
                setNewCarrier('');
                setNewTrackingCode('');
                setResendModalVisible(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
            >
              Reenviar Pedido (Novo Rastreio)
            </button>

            <button
              disabled={actionLoading}
              onClick={async () => {
                if (!window.confirm('Confirmar reembolso total para o cliente?')) return;
                try {
                  setActionLoading(true);
                  await storeOrderService.resolveDispute(order.id, 'refund');
                  alert('Cliente reembolsado com sucesso.');
                  await loadOrder();
                } catch (err: any) {
                  alert(err?.response?.data?.error || 'Erro ao reembolsar.');
                } finally {
                  setActionLoading(false);
                }
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
            >
              Reembolsar Cliente
            </button>
          </div>
        )}
      </div>

      {/* Histórico de Status */}
      {(order.status_history || []).length > 0 && (
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-3 text-gray-800">Histórico de Alterações</h2>
          <ul className="space-y-2">
            {(order.status_history || []).map((h: OrderStatusHistoryItem) => (
              <li
                key={h.id}
                className="text-sm flex justify-between border-b pb-1"
              >
                <span>
                  {h.from_status} ➔ <strong>{h.to_status}</strong>{' '}
                  {h.reason && `(${h.reason})`}
                </span>
                <span className="text-gray-400 text-xs">
                  {new Date(h.created_at).toLocaleString('pt-BR')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal: Inserir Novo Rastreio para Reenvio */}
      {resendModalVisible && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800">Reenviar Pedido Contestado</h3>
            <p className="text-xs text-gray-600">
              Informe os dados do novo pacote para o envio ao cliente:
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Transportadora (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Correios, SEDEX..."
                  value={newCarrier}
                  onChange={(e) => setNewCarrier(e.target.value)}
                  className="w-full border p-2 text-xs rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Novo Código de Rastreio (obrigatório)
                </label>
                <input
                  type="text"
                  placeholder="Ex: AA123456789BR"
                  value={newTrackingCode}
                  onChange={(e) => setNewTrackingCode(e.target.value)}
                  className="w-full border p-2 text-xs rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => {
                  setResendModalVisible(false);
                  setNewTrackingCode('');
                }}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancelar
              </button>
              <button
                disabled={actionLoading}
                onClick={handleResendDisputedOrder}
                className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded font-semibold"
              >
                Confirmar Reenvio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Recebimento do Pacote & Reestocagem (resellable) */}
      {receiptModalVisible && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800">Confirmar Recebimento da Devolução</h3>
            <p className="text-xs text-gray-600">
              O pacote chegou fisicamente? Indique a condição do produto para a atualização de estoque:
            </p>

            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="resellable"
                  checked={isResellable === true}
                  onChange={() => setIsResellable(true)}
                  className="text-orange-600"
                />
                <div>
                  <p className="text-xs font-bold text-gray-800">Apto para revenda (resellable = true)</p>
                  <p className="text-[11px] text-gray-500">O produto voltará ao estoque disponível no catálogo.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="resellable"
                  checked={isResellable === false}
                  onChange={() => setIsResellable(false)}
                  className="text-orange-600"
                />
                <div>
                  <p className="text-xs font-bold text-gray-800">Avariado / Usado (resellable = false)</p>
                  <p className="text-[11px] text-gray-500">O estoque NÃO será incrementado.</p>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => {
                  setReceiptModalVisible(false);
                  setSelectedReturnId(null);
                }}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancelar
              </button>
              <button
                disabled={actionLoading}
                onClick={handleConfirmReturnReceipt}
                className="px-3 py-1.5 text-xs text-white bg-green-600 hover:bg-green-700 rounded font-semibold"
              >
                Confirmar Recebimento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};