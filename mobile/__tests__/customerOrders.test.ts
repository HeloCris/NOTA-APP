import { api } from '@/services/api';
import { listCustomerOrders } from '@/services/customerOrders';

jest.mock('@/services/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

const mockGet = jest.mocked(api.get);

describe('customer orders service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('extrai pedidos de uma resposta paginada do Django REST Framework', async () => {
    const orders = [{ id: 1 }] as never;
    mockGet.mockResolvedValue({ data: { count: 1, next: null, previous: null, results: orders } });

    await expect(listCustomerOrders()).resolves.toEqual(orders);
  });

  it('mantém compatibilidade com uma resposta em array', async () => {
    const orders = [{ id: 2 }] as never;
    mockGet.mockResolvedValue({ data: orders });

    await expect(listCustomerOrders()).resolves.toEqual(orders);
  });

  it('retorna uma lista vazia quando a paginação não contém results', async () => {
    mockGet.mockResolvedValue({ data: { count: 0, results: undefined } });

    await expect(listCustomerOrders()).resolves.toEqual([]);
  });
});
