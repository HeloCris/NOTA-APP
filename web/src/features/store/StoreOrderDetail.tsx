import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  storeOrderService,
  type StoreOrder,
  type OrderStatusHistoryItem,
} from '../../services/storeOrderService';

export const StoreOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionReason, setActionReason] = useState<string>('');

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

  if (loading) {
    return <div className="p-6">Carregando detalhes do pedido...</div>;
  }

  if (!order) {
    return <div className="p-6">Pedido não encontrado.</div>;
  }

  // Tratamento do endereço de entrega (suporta objeto flexível)
  const address = order.shipping_address as Record<string, any> | null;
  const street = address?.shipping_street || address?.street || '';
  const number = address?.shipping_number || address?.number || '';
  const neighborhood =
    address?.shipping_neighborhood || address?.neighborhood || '';
  const city = address?.shipping_city || address?.city || '';
  const state = address?.shipping_state || address?.state || '';
  const zipCode =
    address?.shipping_zip_code || address?.cep || address?.zip_code || '';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">
            Pedido #{order.code || order.id}
          </h1>
          <p className="text-gray-500">Cliente: {order.customer_name}</p>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
          {order.status}
        </span>
      </div>

      {/* Alerta de Endereço Alterado */}
      {order.address_changed && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="font-bold text-yellow-700">
            ⚠️ Endereço alterado pelo cliente
          </p>
        </div>
      )}

      {/* Itens do Pedido */}
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Itens</h2>
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
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-gray-500">
                    Qtd: {item.quantity} x {formatMoney(item.unit_price)}
                  </p>
                </div>
                <p className="font-semibold">{formatMoney(totalPrice)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Endereço e Rastreio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Endereço de Entrega</h2>
          {address ? (
            <>
              <p>
                {street}
                {number ? `, ${number}` : ''}
              </p>
              <p>
                {neighborhood}
                {city ? ` - ${city}` : ''}
                {state ? `/${state}` : ''}
              </p>
              <p>CEP: {zipCode}</p>
            </>
          ) : (
            <p className="text-gray-500">Endereço não informado.</p>
          )}
        </div>

        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Rastreio</h2>
          {order.tracking_code ? (
            <div>
              <p>
                Transportadora:{' '}
                <span className="font-semibold">{order.carrier || 'N/A'}</span>
              </p>
              <p>
                Código:{' '}
                <span className="font-mono font-bold">
                  {order.tracking_code}
                </span>
              </p>
              {order.carrier_url && (
                <a
                  href={`${order.carrier_url}${order.tracking_code}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-blue-600 underline"
                >
                  Rastrear no site da transportadora
                </a>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Sem rastreio cadastrado</p>
          )}
        </div>
      </div>

      {/* Ações Disponíveis */}
      <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
        <h2 className="text-lg font-semibold">Ações Disponíveis</h2>

        {order.status === 'CANCEL_REQUESTED' && (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Motivo (obrigatório em caso de recusa)"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="border p-2 rounded text-sm w-full"
            />
            <div className="flex gap-2">
              <button
                onClick={() =>
                  storeOrderService
                    .respondCancelRequest(order.id, true)
                    .then(loadOrder)
                }
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Aprovar Cancelamento
              </button>
              <button
                onClick={() =>
                  storeOrderService
                    .respondCancelRequest(order.id, false, actionReason)
                    .then(loadOrder)
                }
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Recusar Cancelamento
              </button>
            </div>
          </div>
        )}

        {order.status === 'SHIPPED' && (
          <button
            onClick={() =>
              storeOrderService.markDelivered(order.id).then(loadOrder)
            }
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Marcar como Entregue
          </button>
        )}

        {order.status === 'DELIVERY_DISPUTED' && (
          <div className="flex gap-2">
            <button
              onClick={() =>
                storeOrderService
                  .resolveDispute(order.id, 'reship')
                  .then(loadOrder)
              }
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Reenviar Pedido
            </button>
            <button
              onClick={() =>
                storeOrderService
                  .resolveDispute(order.id, 'refund')
                  .then(loadOrder)
              }
              className="bg-purple-600 text-white px-4 py-2 rounded"
            >
              Reembolsar Cliente
            </button>
          </div>
        )}
      </div>

      {/* Histórico de Status */}
      {(order.status_history || []).length > 0 && (
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Histórico de Alterações</h2>
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
                <span className="text-gray-400">
                  {new Date(h.created_at).toLocaleString('pt-BR')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};