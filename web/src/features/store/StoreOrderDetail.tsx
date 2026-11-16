import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  storeOrderService,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  formatCurrencyBRL,
  formatShippingAddress,
  resolveMediaUrl,
  type StoreOrder,
  type ReturnRequest,
} from '../../services/storeOrderService';
import { ShippingModal } from './ShippingModal';

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const response = (err as { response?: { data?: { error?: string; detail?: string } } }).response;
    return response?.data?.error || response?.data?.detail || fallback;
  }
  return fallback;
}

type SubActionModalType =
  | null
  | 'CANCEL_ORDER'
  | 'APPROVE_CANCELLATION'
  | 'REJECT_CANCELLATION'
  | 'DISPUTE_RESHIP'
  | 'DISPUTE_REFUND'
  | 'APPROVE_RETURN'
  | 'REJECT_RETURN'
  | 'CONFIRM_RETURN_RECEIPT';

interface StoreOrderDetailViewProps {
  order: StoreOrder;
  onOrderUpdated: (updated: StoreOrder) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const StoreOrderDetailView: React.FC<StoreOrderDetailViewProps> = ({
  order,
  onOrderUpdated,
  onClose,
  isModal = false,
}) => {
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [subModal, setSubModal] = useState<SubActionModalType>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Inputs dos sub-modais
  const [cancelReason, setCancelReason] = useState('');
  const [rejectCancelJustification, setRejectCancelJustification] = useState('');
  const [reshipTrackingCode, setReshipTrackingCode] = useState('');
  const [returnRejectReason, setReturnRejectReason] = useState('');
  const [returnResellable, setReturnResellable] = useState(true);
  const [selectedReturnReq, setSelectedReturnReq] = useState<ReturnRequest | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const statusMeta = ORDER_STATUS_STYLES[order.status] || ORDER_STATUS_STYLES.PENDING;
  const statusLabel = ORDER_STATUS_LABELS[order.status] || order.status;

  const subtotalAmount =
    order.subtotal_amount !== undefined
      ? Number(order.subtotal_amount)
      : order.items.reduce(
          (acc, item) =>
            acc + Number(item.total_price ?? Number(item.unit_price) * item.quantity),
          0,
        );
  const shippingCost = Number(order.shipping_cost || 0);
  const discountAmount = Number(order.discount_amount || 0);
  const totalAmount = Number(order.total_amount || 0);

  const openSubModal = (type: SubActionModalType, req?: ReturnRequest) => {
    setFeedbackError(null);
    setFeedbackSuccess(null);
    if (req) setSelectedReturnReq(req);
    setSubModal(type);
  };

  const closeSubModal = () => {
    if (actionLoading) return;
    setSubModal(null);
    setFeedbackError(null);
  };

  const refreshOrderFromServer = async () => {
    const updated = await storeOrderService.getOrderDetail(order.id);
    onOrderUpdated(updated);
    return updated;
  };

  const handleMoveToProcessing = async () => {
    try {
      setActionLoading(true);
      setFeedbackError(null);
      await storeOrderService.updateOrderStatus(order.id, 'PROCESSING');
      await refreshOrderFromServer();
      setFeedbackSuccess('Pedido movido para separação.');
    } catch (err: unknown) {
      setFeedbackError(getApiErrorMessage(err, 'Erro ao iniciar separação do pedido.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleShipConfirm = async (carrier: string, trackingCode: string) => {
    try {
      setActionLoading(true);
      setFeedbackError(null);
      await storeOrderService.shipOrder(order.id, {
        carrier,
        tracking_code: trackingCode,
      });
      await refreshOrderFromServer();
      setIsShippingModalOpen(false);
      setFeedbackSuccess('Pedido despachado e código de rastreio enviado ao comprador.');
    } catch (err: unknown) {
      setFeedbackError(getApiErrorMessage(err, 'Erro ao despachar o pedido.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliverConfirm = async () => {
    try {
      setActionLoading(true);
      setFeedbackError(null);
      await storeOrderService.markDelivered(order.id);
      await refreshOrderFromServer();
      setFeedbackSuccess('Entrega confirmada com sucesso.');
    } catch (err: unknown) {
      setFeedbackError(getApiErrorMessage(err, 'Erro ao confirmar entrega do pedido.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteSubAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);

    try {
      setActionLoading(true);

      if (subModal === 'CANCEL_ORDER') {
        if (cancelReason.trim().length < 5) {
          setFeedbackError('Informe o motivo do cancelamento (mínimo de 5 caracteres).');
          setActionLoading(false);
          return;
        }
        await storeOrderService.cancelOrder(order.id, cancelReason.trim());
        setCancelReason('');
        await refreshOrderFromServer();
        setFeedbackSuccess('Pedido cancelado e estoque restaurado.');
      } else if (subModal === 'APPROVE_CANCELLATION') {
        await storeOrderService.respondCancelRequest(order.id, true);
        await refreshOrderFromServer();
        setFeedbackSuccess('Solicitação de cancelamento aprovada.');
      } else if (subModal === 'REJECT_CANCELLATION') {
        if (rejectCancelJustification.trim().length < 5) {
          setFeedbackError('Informe a justificativa da recusa (mínimo de 5 caracteres).');
          setActionLoading(false);
          return;
        }
        await storeOrderService.respondCancelRequest(
          order.id,
          false,
          rejectCancelJustification.trim(),
        );
        setRejectCancelJustification('');
        await refreshOrderFromServer();
        setFeedbackSuccess('Solicitação de cancelamento recusada. O pedido voltou para separação.');
      } else if (subModal === 'DISPUTE_RESHIP') {
        if (reshipTrackingCode.trim().length < 6) {
          setFeedbackError('Informe o novo código de rastreio (mínimo de 6 caracteres).');
          setActionLoading(false);
          return;
        }
        await storeOrderService.resolveDispute(order.id, 'reship', reshipTrackingCode.trim());
        setReshipTrackingCode('');
        await refreshOrderFromServer();
        setFeedbackSuccess('Contestação resolvida com reenvio da encomenda.');
      } else if (subModal === 'DISPUTE_REFUND') {
        await storeOrderService.resolveDispute(order.id, 'refund');
        await refreshOrderFromServer();
        setFeedbackSuccess('Contestação resolvida com reembolso integral ao comprador.');
      } else if (subModal === 'APPROVE_RETURN' && selectedReturnReq) {
        await storeOrderService.processReturn(selectedReturnReq.id, 'approve');
        await refreshOrderFromServer();
        setFeedbackSuccess('Solicitação de devolução aprovada.');
      } else if (subModal === 'REJECT_RETURN' && selectedReturnReq) {
        if (returnRejectReason.trim().length < 5) {
          setFeedbackError('Informe a justificativa para recusar a devolução.');
          setActionLoading(false);
          return;
        }
        await storeOrderService.processReturn(selectedReturnReq.id, 'reject', {
          reason: returnRejectReason.trim(),
        });
        setReturnRejectReason('');
        await refreshOrderFromServer();
        setFeedbackSuccess('Solicitação de devolução recusada.');
      } else if (subModal === 'CONFIRM_RETURN_RECEIPT' && selectedReturnReq) {
        await storeOrderService.processReturn(selectedReturnReq.id, 'receive', {
          resellable: returnResellable,
        });
        await refreshOrderFromServer();
        setFeedbackSuccess('Recebimento confirmado e devolução concluída.');
      }

      setSubModal(null);
    } catch (err: unknown) {
      setFeedbackError(getApiErrorMessage(err, 'Não foi possível concluir a operação.'));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="text-[#1A1A1A]">
      {/* Header do Pedido */}
      <div
        className={`flex flex-wrap items-start justify-between gap-4 border-b border-[#EFEBDD] ${
          isModal ? 'px-7 py-5 bg-[#FAF8F5]' : 'pb-6 mb-6'
        }`}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#A24726] bg-[#FAF3EE] border border-[#EED9CE] px-2.5 py-0.5 rounded-full">
              Pedido #{order.code || order.id}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
              {statusLabel}
            </span>
            {order.urgency_status &&
              (order.status === 'PAID' || order.status === 'PROCESSING') && (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    order.urgency_status === 'DELAYED'
                      ? 'bg-[#FCECEC] text-[#9E2A2B] border-[#E8B8B8]'
                      : order.urgency_status === 'DUE_TODAY'
                      ? 'bg-[#FBF3E4] text-[#8B6220] border-[#E8D5B0]'
                      : 'bg-[#EAF3E6] text-[#2E5425] border-[#B8D4AE]'
                  }`}
                >
                  {order.urgency_status === 'DELAYED'
                    ? 'Despacho atrasado'
                    : order.urgency_status === 'DUE_TODAY'
                    ? 'Enviar hoje'
                    : 'Prazo em dia'}
                </span>
              )}
          </div>
          <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1A1A1A] mt-2">
            {order.customer_name || 'Cliente NŌTA'}
          </h2>
          <p className="text-xs text-[#6E685F] mt-0.5">
            Realizado em{' '}
            {new Date(order.created_at).toLocaleString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {/* Ações Rápidas do Pedido */}
        <div className="flex flex-wrap items-center gap-2.5">
          {order.status === 'PAID' && (
            <>
              <button
                type="button"
                onClick={() => openSubModal('CANCEL_ORDER')}
                className="px-4 py-2 text-xs font-semibold text-[#9E2A2B] bg-white border border-[#E8B8B8] rounded-xl hover:bg-[#FCECEC] transition-colors cursor-pointer"
              >
                Cancelar Pedido
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleMoveToProcessing}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#354B5E] rounded-xl hover:bg-[#283A49] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Processando...' : 'Iniciar Separação'}
              </button>
            </>
          )}

          {order.status === 'PROCESSING' && (
            <>
              <button
                type="button"
                onClick={() => openSubModal('CANCEL_ORDER')}
                className="px-4 py-2 text-xs font-semibold text-[#9E2A2B] bg-white border border-[#E8B8B8] rounded-xl hover:bg-[#FCECEC] transition-colors cursor-pointer"
              >
                Cancelar Pedido
              </button>
              <button
                type="button"
                onClick={() => setIsShippingModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#354B5E] rounded-xl hover:bg-[#283A49] transition-colors shadow-xs cursor-pointer"
              >
                Despachar Encomenda
              </button>
            </>
          )}

          {order.status === 'SHIPPED' && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleDeliverConfirm}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#5C6B4E] rounded-xl hover:bg-[#49563D] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? 'Confirmando...' : 'Confirmar Entrega'}
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar detalhes do pedido"
              className="w-9 h-9 rounded-full bg-white border border-[#E2DEC9] flex items-center justify-center text-[#5A554E] hover:text-[#1A1A1A] hover:bg-[#F5F2EC] transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Corpo Principal */}
      <div className={isModal ? 'p-7 space-y-6 max-h-[78vh] overflow-y-auto' : 'space-y-6'}>
        {/* Feedbacks de sucesso/erro */}
        {feedbackSuccess && (
          <div className="p-4 rounded-xl bg-[#EAF3E6] border border-[#B8D4AE] text-[#2E5425] text-sm font-medium flex items-center justify-between">
            <span>{feedbackSuccess}</span>
            <button
              type="button"
              onClick={() => setFeedbackSuccess(null)}
              className="text-xs underline ml-4 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}
        {feedbackError && !subModal && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-[#FCECEC] border border-[#E8B8B8] text-[#9E2A2B] text-sm font-medium"
          >
            {feedbackError}
          </div>
        )}

        {/* BANNER DE AÇÃO CRÍTICA: Cancelamento Solicitado pelo Comprador */}
        {order.status === 'CANCEL_REQUESTED' && (
          <div className="rounded-2xl bg-[#FDF5F0] border border-[#ECC8BC] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#A24726]">
                Ação Necessária · Solicitação de Cancelamento
              </span>
              <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#1A1A1A]">
                O comprador solicitou o cancelamento deste pedido
              </h3>
              <p className="text-xs text-[#5A554E]">
                Motivo informado:{' '}
                <strong className="text-[#1A1A1A]">
                  {order.cancel_reason || 'Não especificado pelo comprador'}
                </strong>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => openSubModal('REJECT_CANCELLATION')}
                className="px-4 py-2 text-xs font-semibold text-[#354B5E] bg-white border border-[#CBD8E3] rounded-xl hover:bg-[#EEF3F7] transition-colors cursor-pointer"
              >
                Recusar e Manter Pedido
              </button>
              <button
                type="button"
                onClick={() => openSubModal('APPROVE_CANCELLATION')}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#A24726] rounded-xl hover:bg-[#87381C] transition-colors cursor-pointer"
              >
                Aprovar Cancelamento
              </button>
            </div>
          </div>
        )}

        {/* BANNER DE AÇÃO CRÍTICA: Entrega Contestada */}
        {order.status === 'DELIVERY_DISPUTED' && (
          <div className="rounded-2xl bg-[#FCECEC] border border-[#E8B8B8] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#9E2A2B]">
                Urgente · Entrega Contestada pelo Comprador
              </span>
              <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#1A1A1A]">
                O cliente reportou que não recebeu a encomenda
              </h3>
              <p className="text-xs text-[#5A554E]">
                Verifique junto à transportadora ({order.carrier || 'Não informada'} ·{' '}
                {order.tracking_code || 'S/N'}) e escolha como solucionar o chamado.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => openSubModal('DISPUTE_RESHIP')}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#354B5E] rounded-xl hover:bg-[#283A49] transition-colors cursor-pointer"
              >
                Registrar Reenvio
              </button>
              <button
                type="button"
                onClick={() => openSubModal('DISPUTE_REFUND')}
                className="px-4 py-2 text-xs font-semibold text-[#9E2A2B] bg-white border border-[#E8B8B8] rounded-xl hover:bg-[#F9DCDC] transition-colors cursor-pointer"
              >
                Reembolsar Comprador
              </button>
            </div>
          </div>
        )}

        {/* Grid Principal: Itens Comprados + Resumo Financeiro / Pagamento */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda (2/3): Itens do Pedido */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EFEBDD] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#EFEBDD]">
              <div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#1A1A1A]">
                  Itens do Pedido
                </h3>
                <p className="text-xs text-[#6E685F]">
                  {order.items?.length || 0}{' '}
                  {(order.items?.length || 0) === 1
                    ? 'fragrância adquirida'
                    : 'fragrâncias adquiridas'}
                </p>
              </div>
              <span className="text-xs font-semibold text-[#354B5E] bg-[#EEF3F7] px-3 py-1 rounded-full">
                {order.items?.reduce((acc, i) => acc + i.quantity, 0) || 0} un. no total
              </span>
            </div>

            {order.items && order.items.length > 0 ? (
              <div className="divide-y divide-[#F2EFE6]">
                {order.items.map((item) => {
                  const itemSubtotal =
                    item.total_price !== undefined
                      ? Number(item.total_price)
                      : Number(item.unit_price) * item.quantity;

                  return (
                    <div
                      key={item.id}
                      className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {item.product_image ? (
                          <img
                            src={resolveMediaUrl(item.product_image)}
                            alt={item.product_name}
                            className="w-13 h-13 rounded-xl object-cover border border-[#EFEBDD] bg-[#FAF8F5] shrink-0"
                          />
                        ) : (
                          <div className="w-13 h-13 rounded-xl border border-[#EFEBDD] bg-[#FAF8F5] flex flex-col items-center justify-center text-[#8C857B] shrink-0">
                            <span className="text-[10px] font-bold uppercase tracking-tighter">
                              NŌTA
                            </span>
                            {item.volume_ml ? (
                              <span className="text-[10px] font-semibold text-[#A24726]">
                                {item.volume_ml}ml
                              </span>
                            ) : null}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-[#1A1A1A] truncate">
                            {item.product_name}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#6E685F]">
                            {item.brand_name && <span>{item.brand_name}</span>}
                            {item.volume_ml && (
                              <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D0] text-[#4A4640] font-medium">
                                Frasco / Decant {item.volume_ml}ml
                              </span>
                            )}
                            <span>
                              {item.quantity}x de {formatCurrencyBRL(item.unit_price)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#1A1A1A]">
                          {formatCurrencyBRL(itemSubtotal)}
                        </p>
                        <p className="text-[11px] text-[#8C857B]">Subtotal do item</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[#8C857B] py-4">
                Nenhum item detalhado disponível para este pedido.
              </p>
            )}
          </div>

          {/* Coluna Direita (1/3): Resumo do Pagamento */}
          <div className="bg-white rounded-2xl border border-[#EFEBDD] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#EFEBDD]">
                <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#1A1A1A]">
                  Pagamento & Valores
                </h3>
                <span
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                    order.payment_method === 'CREDIT_CARD' || order.payment_method_label?.includes('Cartão')
                      ? 'bg-[#EEF3F7] border-[#CBD8E3] text-[#354B5E]'
                      : 'bg-[#FAF8F5] border-[#E2DEC9] text-[#4A4640]'
                  }`}
                >
                  {order.payment_method_label ||
                    (order.status === 'PENDING' ? 'Aguardando Pagamento' : 'Cartão / PIX')}
                </span>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between text-[#5A554E]">
                  <span>Subtotal dos itens</span>
                  <span className="font-medium text-[#1A1A1A]">
                    {formatCurrencyBRL(subtotalAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[#5A554E]">
                  <span>
                    Frete {order.shipping_service ? `(${order.shipping_service})` : ''}
                  </span>
                  <span className="font-medium text-[#1A1A1A]">
                    {shippingCost > 0 ? formatCurrencyBRL(shippingCost) : 'Grátis'}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-[#5C6B4E]">
                    <span className="flex items-center gap-1.5">
                      Desconto aplicado
                      {order.coupon_code && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-[#F0F4EC] border border-[#CED9C4] rounded">
                          {order.coupon_code}
                        </span>
                      )}
                    </span>
                    <span className="font-semibold">- {formatCurrencyBRL(discountAmount)}</span>
                  </div>
                )}

                <div className="pt-3 mt-3 border-t border-[#EFEBDD] flex items-baseline justify-between">
                  <div>
                    <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#1A1A1A]">
                      Total pago pelo cliente
                    </span>
                    <p className="text-[11px] text-[#8C857B]">
                      Forma: {order.payment_method_label || 'Processado pela plataforma'}
                    </p>
                  </div>
                  <span className="font-['Plus_Jakarta_Sans'] text-lg font-extrabold text-[#354B5E]">
                    {formatCurrencyBRL(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {order.status === 'REFUNDED' && (
              <div className="mt-4 pt-3 border-t border-[#E8B8B8] bg-[#FCECEC] rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#9E2A2B]">Pedido Estornado</span>
                <span className="text-sm font-bold text-[#9E2A2B]">
                  {formatCurrencyBRL(totalAmount)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Segunda Linha: Cliente & Endereço + Logística & Rastreamento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dados do Cliente e Entrega */}
          <div className="bg-white rounded-2xl border border-[#EFEBDD] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#1A1A1A] pb-3 mb-3 border-b border-[#EFEBDD]">
              Comprador & Endereço de Entrega
            </h3>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C857B]">
                    Cliente
                  </p>
                  <p className="font-semibold text-[#1A1A1A] mt-0.5">
                    {order.customer_name || 'Cliente NŌTA'}
                  </p>
                </div>
                {order.customer_email && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C857B]">
                      E-mail de Contato
                    </p>
                    <p className="text-[#4A4640] mt-0.5 break-all">{order.customer_email}</p>
                  </div>
                )}
              </div>

              {order.customer_phone && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C857B]">
                    Telefone / WhatsApp
                  </p>
                  <p className="text-[#4A4640] mt-0.5">{order.customer_phone}</p>
                </div>
              )}

              <div className="pt-2 border-t border-[#F4F1EA]">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C857B]">
                  Endereço Completo para Envio
                </p>
                <p className="text-[#1A1A1A] font-medium mt-1 leading-relaxed bg-[#FAF8F5] p-3 rounded-xl border border-[#EFEBDD]">
                  {formatShippingAddress(order.shipping_address)}
                </p>
              </div>
            </div>
          </div>

          {/* Dados de Logística e Rastreio */}
          <div className="bg-white rounded-2xl border border-[#EFEBDD] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#1A1A1A] pb-3 mb-3 border-b border-[#EFEBDD]">
              Logística & Rastreamento
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C857B]">
                  Modalidade Contratada
                </p>
                <p className="font-semibold text-[#1A1A1A] mt-0.5">
                  {order.shipping_service || 'Envio Padrão'}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C857B]">
                  Transportadora
                </p>
                <p className="font-semibold text-[#1A1A1A] mt-0.5">
                  {order.carrier || 'Aguardando despacho'}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C857B]">
                  Código de Rastreio
                </p>
                {order.tracking_code ? (
                  <span className="inline-block mt-1 font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[#EEF3F7] text-[#354B5E] border border-[#CBD8E3]">
                    {order.tracking_code}
                  </span>
                ) : (
                  <p className="text-[#8C857B] mt-0.5">Ainda não informado</p>
                )}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C857B]">
                  Prazo Limite de Postagem
                </p>
                <p className="text-[#1A1A1A] font-medium mt-0.5">
                  {order.dispatch_deadline
                    ? new Date(order.dispatch_deadline).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : 'Não aplicável'}
                </p>
              </div>
            </div>

            {(order.shipped_at || order.delivered_at) && (
              <div className="mt-4 pt-3 border-t border-[#F4F1EA] grid grid-cols-2 gap-4 text-xs text-[#6E685F]">
                {order.shipped_at && (
                  <div>
                    <span className="block font-semibold text-[#1A1A1A]">Postado em:</span>
                    {new Date(order.shipped_at).toLocaleString('pt-BR')}
                  </div>
                )}
                {order.delivered_at && (
                  <div>
                    <span className="block font-semibold text-[#1A1A1A]">Entregue em:</span>
                    {new Date(order.delivered_at).toLocaleString('pt-BR')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Solicitações de Devolução (se houver) */}
        {order.return_requests && order.return_requests.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E8C9B5] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#F2E4DA] pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#A24726]">
                  Pós-Venda · Logística Reversa
                </span>
                <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#1A1A1A]">
                  Solicitações de Devolução ({order.return_requests.length})
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              {order.return_requests.map((req) => {
                const reqStatusLabel =
                  req.status === 'REQUESTED'
                    ? 'Aguardando Análise da Loja'
                    : req.status === 'APPROVED'
                    ? 'Aprovada · Aguardando Objeto'
                    : req.status === 'REJECTED'
                    ? 'Devolução Recusada'
                    : 'Concluída e Reembolsada';

                return (
                  <div
                    key={req.id}
                    className="rounded-xl border border-[#EFEBDD] bg-[#FAF8F5] p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#1A1A1A]">
                        Protocolo de Devolução #{req.id} · Reembolso estimado:{' '}
                        {formatCurrencyBRL(req.refund_amount)}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          req.status === 'REQUESTED'
                            ? 'bg-[#FDF3EC] text-[#A24726] border-[#E8C9B5]'
                            : req.status === 'APPROVED'
                            ? 'bg-[#EEF3F7] text-[#354B5E] border-[#CBD8E3]'
                            : req.status === 'REFUNDED' || req.status === 'RECEIVED'
                            ? 'bg-[#EAF3E6] text-[#2E5425] border-[#B8D4AE]'
                            : 'bg-[#F4F1EA] text-[#6E685F] border-[#DCD6C8]'
                        }`}
                      >
                        {reqStatusLabel}
                      </span>
                    </div>

                    <p className="text-sm text-[#4A4640]">
                      <strong className="text-[#1A1A1A]">Motivo alegado pelo cliente:</strong>{' '}
                      {req.reason}
                      {req.description ? ` — ${req.description}` : ''}
                    </p>

                    {/* Itens devolvidos */}
                    <div className="bg-white rounded-xl p-3 border border-[#EFEBDD]">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C857B] mb-2">
                        Itens incluídos na devolução
                      </p>
                      <ul className="space-y-1 text-xs text-[#1A1A1A]">
                        {req.items.map((ri) => (
                          <li key={ri.id} className="flex items-center justify-between">
                            <span>{ri.product_name}</span>
                            <span className="font-semibold">
                              {ri.quantity}x ({formatCurrencyBRL(ri.unit_price)})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Evidências fotográficas com Lightbox */}
                    {req.photos && req.photos.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C857B] mb-2">
                          Fotos enviadas pelo comprador (clique para ampliar)
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                          {req.photos.map((p) => {
                            const fullPhotoUrl = resolveMediaUrl(p.image);
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setLightboxUrl(fullPhotoUrl)}
                                className="group relative w-16 h-16 rounded-xl overflow-hidden border border-[#DCD6C8] bg-white cursor-pointer"
                              >
                                <img
                                  src={fullPhotoUrl}
                                  alt="Evidência de devolução"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {req.resellable !== null && req.resellable !== undefined && (
                      <p className="text-xs text-[#354B5E] bg-[#EEF3F7] p-3 rounded-xl border border-[#CBD8E3]">
                        <strong>Inspeção de estoque:</strong>{' '}
                        {req.resellable
                          ? 'Item recebido em perfeitas condições e reintegrado ao estoque.'
                          : 'Item recebido com avaria (estoque não reintegrado).'}
                      </p>
                    )}

                    {/* Botões de ação da devolução */}
                    {req.status === 'REQUESTED' && (
                      <div className="flex flex-wrap items-center gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => openSubModal('APPROVE_RETURN', req)}
                          className="px-4 py-2 text-xs font-semibold text-white bg-[#5C6B4E] rounded-xl hover:bg-[#49563D] transition-colors cursor-pointer"
                        >
                          Aprovar Devolução
                        </button>
                        <button
                          type="button"
                          onClick={() => openSubModal('REJECT_RETURN', req)}
                          className="px-4 py-2 text-xs font-semibold text-[#9E2A2B] bg-white border border-[#E8B8B8] rounded-xl hover:bg-[#FCECEC] transition-colors cursor-pointer"
                        >
                          Recusar Devolução
                        </button>
                      </div>
                    )}

                    {req.status === 'APPROVED' && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => openSubModal('CONFIRM_RETURN_RECEIPT', req)}
                          className="px-4 py-2 text-xs font-semibold text-white bg-[#354B5E] rounded-xl hover:bg-[#283A49] transition-colors cursor-pointer"
                        >
                          Confirmar Recebimento do Pacote Devolvido
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Histórico de Status e Auditoria */}
        <div className="bg-white rounded-2xl border border-[#EFEBDD] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#1A1A1A] pb-3 mb-4 border-b border-[#EFEBDD]">
            Linha do Tempo do Pedido
          </h3>

          {order.status_history && order.status_history.length > 0 ? (
            <div className="relative pl-5 space-y-4 before:content-[''] before:absolute before:left-1.75 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E0D0]">
              {order.status_history.map((hist) => {
                const toStatusLabel = ORDER_STATUS_LABELS[hist.to_status] || hist.to_status;
                return (
                  <div key={hist.id} className="relative">
                    <span className="absolute -left-5 top-1.5 w-3 h-3 rounded-full bg-[#354B5E] ring-4 ring-white" />
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-[#1A1A1A]">
                        {toStatusLabel}
                        {hist.actor_name ? (
                          <span className="text-xs font-normal text-[#6E685F]">
                            {' '}
                            · por {hist.actor_name}
                          </span>
                        ) : null}
                      </p>
                      <span className="text-xs text-[#8C857B]">
                        {new Date(hist.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    {hist.reason && <p className="text-xs text-[#5A554E] mt-0.5">{hist.reason}</p>}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-[#8C857B]">Nenhum evento registrado no histórico.</p>
          )}
        </div>
      </div>

      {/* Modal de Despacho (ShippingModal) */}
      {isShippingModalOpen && (
        <ShippingModal
          order={order}
          isSubmitting={actionLoading}
          onCancel={() => setIsShippingModalOpen(false)}
          onSubmit={handleShipConfirm}
        />
      )}

      {/* Sub-modais de Pós-Venda (Cancelamento, Contestação, Devolução) */}
      {subModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-4"
          onClick={closeSubModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#FAF8F5] border border-[#E2DEC9] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-white border-b border-[#EFEBDD] flex items-center justify-between">
              <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#1A1A1A]">
                {subModal === 'CANCEL_ORDER' && `Cancelar Pedido #${order.code || order.id}`}
                {subModal === 'APPROVE_CANCELLATION' && 'Aprovar Solicitação de Cancelamento'}
                {subModal === 'REJECT_CANCELLATION' && 'Recusar Solicitação de Cancelamento'}
                {subModal === 'DISPUTE_RESHIP' && 'Resolver Contestação · Novo Envio'}
                {subModal === 'DISPUTE_REFUND' && 'Resolver Contestação · Reembolso'}
                {subModal === 'APPROVE_RETURN' && 'Aprovar Solicitação de Devolução'}
                {subModal === 'REJECT_RETURN' && 'Recusar Solicitação de Devolução'}
                {subModal === 'CONFIRM_RETURN_RECEIPT' && 'Confirmar Recebimento de Devolução'}
              </h3>
              <button
                type="button"
                onClick={closeSubModal}
                className="text-sm text-[#6E685F] hover:text-[#1A1A1A] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteSubAction} className="p-6 space-y-4">
              {feedbackError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-[#FCECEC] border border-[#E8B8B8] text-xs font-medium text-[#9E2A2B]"
                >
                  {feedbackError}
                </div>
              )}

              {subModal === 'CANCEL_ORDER' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5A554E] mb-2">
                    Motivo do Cancelamento pela Loja
                  </label>
                  <textarea
                    rows={3}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Ex: Ruptura pontual de lote no estoque físico. O cliente será reembolsado integralmente."
                    className="w-full rounded-xl border border-[#DCD6C8] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] focus:border-[#354B5E] focus:outline-none"
                  />
                  <p className="text-[11px] text-[#6E685F] mt-1.5">
                    O estoque dos itens será restaurado automaticamente e o comprador notificado.
                  </p>
                </div>
              )}

              {subModal === 'APPROVE_CANCELLATION' && (
                <div className="space-y-2 text-sm text-[#4A4640]">
                  <p>
                    Confirma a aprovação do cancelamento solicitado por{' '}
                    <strong className="text-[#1A1A1A]">{order.customer_name}</strong>?
                  </p>
                  <p className="text-xs text-[#6E685F] bg-white p-3 rounded-xl border border-[#EFEBDD]">
                    O valor de <strong>{formatCurrencyBRL(totalAmount)}</strong> será estornado ao
                    comprador e as unidades retornarão ao estoque da sua vitrine.
                  </p>
                </div>
              )}

              {subModal === 'REJECT_CANCELLATION' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5A554E] mb-2">
                    Justificativa para Manter o Pedido
                  </label>
                  <textarea
                    rows={3}
                    value={rejectCancelJustification}
                    onChange={(e) => setRejectCancelJustification(e.target.value)}
                    placeholder="Ex: O pedido já foi embalado e coletado pela transportadora."
                    className="w-full rounded-xl border border-[#DCD6C8] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] focus:border-[#354B5E] focus:outline-none"
                  />
                </div>
              )}

              {subModal === 'DISPUTE_RESHIP' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5A554E] mb-1.5">
                      Novo Código de Rastreio
                    </label>
                    <input
                      type="text"
                      value={reshipTrackingCode}
                      onChange={(e) => setReshipTrackingCode(e.target.value)}
                      placeholder="Ex: BR998877665BR"
                      className="w-full rounded-xl border border-[#DCD6C8] bg-white px-3.5 py-2.5 text-sm font-mono uppercase text-[#1A1A1A] focus:border-[#354B5E] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {subModal === 'DISPUTE_REFUND' && (
                <div className="space-y-3">
                  <p className="text-xs text-[#5A554E] bg-white p-3 rounded-xl border border-[#EFEBDD]">
                    O comprador receberá o reembolso integral de{' '}
                    <strong className="text-[#1A1A1A]">{formatCurrencyBRL(totalAmount)}</strong> e o
                    pedido será marcado como Reembolsado.
                  </p>
                </div>
              )}

              {subModal === 'APPROVE_RETURN' && selectedReturnReq && (
                <div className="space-y-2 text-sm text-[#4A4640]">
                  <p>
                    Deseja aprovar o protocolo de devolução <strong>#{selectedReturnReq.id}</strong>?
                  </p>
                  <p className="text-xs text-[#6E685F] bg-white p-3 rounded-xl border border-[#EFEBDD]">
                    O comprador será autorizado a enviar os itens de volta. O reembolso (
                    <strong>{formatCurrencyBRL(selectedReturnReq.refund_amount)}</strong>) será
                    processado após a conferência física do pacote.
                  </p>
                </div>
              )}

              {subModal === 'REJECT_RETURN' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5A554E] mb-2">
                    Justificativa da Recusa
                  </label>
                  <textarea
                    rows={3}
                    value={returnRejectReason}
                    onChange={(e) => setReturnRejectReason(e.target.value)}
                    placeholder="Ex: O lacre de segurança foi violado e o volume consumido excede a política de devolução."
                    className="w-full rounded-xl border border-[#DCD6C8] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] focus:border-[#354B5E] focus:outline-none"
                  />
                </div>
              )}

              {subModal === 'CONFIRM_RETURN_RECEIPT' && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#5A554E] mb-2">
                      Condição de Inspeção dos Itens Recebidos
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      <label
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          returnResellable
                            ? 'bg-[#EAF3E6] border-[#5C6B4E]'
                            : 'bg-white border-[#DCD6C8]'
                        }`}
                      >
                        <input
                          type="radio"
                          checked={returnResellable}
                          onChange={() => setReturnResellable(true)}
                          className="mt-1"
                        />
                        <div>
                          <span className="block text-xs font-bold text-[#1A1A1A]">
                            Apto para revenda (repor ao estoque automaticamente)
                          </span>
                          <span className="block text-[11px] text-[#5A554E]">
                            O produto chegou intacto e as unidades voltarão ao saldo disponível.
                          </span>
                        </div>
                      </label>

                      <label
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          !returnResellable
                            ? 'bg-[#FDF0EC] border-[#A24726]'
                            : 'bg-white border-[#DCD6C8]'
                        }`}
                      >
                        <input
                          type="radio"
                          checked={!returnResellable}
                          onChange={() => setReturnResellable(false)}
                          className="mt-1"
                        />
                        <div>
                          <span className="block text-xs font-bold text-[#1A1A1A]">
                            Avariado / Sem condições de revenda (não repor estoque)
                          </span>
                          <span className="block text-[11px] text-[#5A554E]">
                            O reembolso ao cliente será concluído sem incrementar o estoque da loja.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EFEBDD]">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={closeSubModal}
                  className="px-4 py-2 text-xs font-semibold text-[#5A554E] bg-white border border-[#DCD6C8] rounded-xl hover:bg-[#F4F1EA] transition-colors cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#354B5E] rounded-xl hover:bg-[#283A49] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Processando...' : 'Confirmar Decisão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox de fotos de evidência */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-2xl w-full bg-white p-3 rounded-2xl shadow-2xl">
            <img
              src={lightboxUrl}
              alt="Evidência ampliada"
              className="w-full max-h-[75vh] object-contain rounded-xl"
            />
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="mt-3 w-full py-2 text-xs font-bold text-[#1A1A1A] bg-[#FAF8F5] border border-[#E2DEC9] rounded-xl hover:bg-[#EFEBDD] cursor-pointer"
            >
              Fechar Visualização
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface StoreOrderDetailModalProps {
  orderId: number | null;
  initialOrder?: StoreOrder | null;
  onClose: () => void;
  onOrderUpdated?: (updated: StoreOrder) => void;
}

export const StoreOrderDetailModal: React.FC<StoreOrderDetailModalProps> = ({
  orderId,
  initialOrder = null,
  onClose,
  onOrderUpdated,
}) => {
  const [order, setOrder] = useState<StoreOrder | null>(initialOrder);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    let active = true;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await storeOrderService.getOrderDetail(orderId);
        if (active) setOrder(data);
      } catch {
        if (active) setError('Não foi possível carregar os detalhes completos deste pedido.');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchDetail();
    return () => {
      active = false;
    };
  }, [orderId]);

  if (!orderId) return null;

  const handleUpdated = (updated: StoreOrder) => {
    setOrder(updated);
    onOrderUpdated?.(updated);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-3xl bg-[#FAF8F5] border border-[#E2DEC9] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {loading && !order ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#354B5E] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-[#5A554E]">
              Carregando ficha completa do pedido #{orderId}...
            </p>
          </div>
        ) : error && !order ? (
          <div className="p-8 text-center space-y-4">
            <p className="text-sm font-semibold text-[#9E2A2B]">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-[#354B5E] text-white rounded-xl cursor-pointer"
            >
              Fechar
            </button>
          </div>
        ) : order ? (
          <StoreOrderDetailView
            order={order}
            onOrderUpdated={handleUpdated}
            onClose={onClose}
            isModal
          />
        ) : null}
      </div>
    </div>
  );
};

export const StoreOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await storeOrderService.getOrderDetail(Number(id));
        if (active) {
          setOrder(data);
          setError(null);
        }
      } catch {
        if (active) setError('Erro ao carregar detalhes do pedido.');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchOrder();
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#354B5E] hover:text-[#1A1A1A] bg-white border border-[#EFEBDD] px-3.5 py-2 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            ← Voltar para Gestão de Pedidos
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-[#EFEBDD] p-12 text-center text-sm text-[#6E685F]">
            Carregando detalhes do pedido...
          </div>
        ) : error || !order ? (
          <div className="bg-white rounded-2xl border border-[#E8B8B8] p-8 text-center text-sm text-[#9E2A2B]">
            {error || 'Pedido não encontrado.'}
          </div>
        ) : (
          <StoreOrderDetailView order={order} onOrderUpdated={setOrder} />
        )}
      </div>
    </div>
  );
};
export default StoreOrderDetailPage;
