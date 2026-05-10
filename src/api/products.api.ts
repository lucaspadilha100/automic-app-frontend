import { apiClient, publicApiClient } from './client'

export const productsApi = {
  listCategories: async () => (await apiClient.get('/product-categories')).data,
  createCategory: async (data: { name: string; sort_order?: number }) =>
    (await apiClient.post('/product-categories', data)).data,
  updateCategory: async (id: string, data: Record<string, unknown>) =>
    (await apiClient.put(`/product-categories/${id}`, data)).data,
  deleteCategory: async (id: string) => (await apiClient.delete(`/product-categories/${id}`)).data,

  list: async (params?: { category_id?: string; is_active?: boolean }) =>
    (await apiClient.get('/products', { params })).data,
  get: async (id: string) => (await apiClient.get(`/products/${id}`)).data,
  create: async (data: Record<string, unknown>) => (await apiClient.post('/products', data)).data,
  update: async (id: string, data: Record<string, unknown>) =>
    (await apiClient.put(`/products/${id}`, data)).data,
  delete: async (id: string) => (await apiClient.delete(`/products/${id}`)).data,
  adjustStock: async (id: string, adjustment: number, reason?: string) =>
    (await apiClient.post(`/products/${id}/adjust-stock`, { adjustment, reason })).data,

  listOrders: async (params?: { status?: string }) =>
    (await apiClient.get('/product-orders', { params })).data,
  createOrder: async (data: Record<string, unknown>) =>
    (await apiClient.post('/product-orders', data)).data,
  updateOrderStatus: async (id: string, status: string) =>
    (await apiClient.patch(`/product-orders/${id}/status`, { status })).data,
  markOrderPaid: async (id: string, payment_method: string) =>
    (await apiClient.patch(`/product-orders/${id}/payment`, { payment_method })).data,

  publicList: async (slug: string) =>
    (await publicApiClient.get(`/public/${slug}/products`)).data,
}
