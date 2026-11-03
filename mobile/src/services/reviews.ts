import { api } from './api';

export type ReviewPhoto = {
  id: number;
  image: string;
};

export type ReviewReply = {
  id: number;
  text?: string;
  comment?: string;
  author_name?: string;
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: number;
  order_item: number;
  user_name?: string;
  author_name: string;
  product_name: string;
  product_image?: string | null;
  volume_ml?: number;
  rating: number;
  comment?: string;
  photos: ReviewPhoto[];
  reply?: ReviewReply | null;
  edited_at?: string | null;
  is_edited?: boolean;
  can_edit?: boolean;
  created_at: string;
};

export type ReviewSummary = {
  count: number;
  average: number;
  distribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
};

export type StoreReviewsResponse = {
  results: Review[];
  summary: ReviewSummary;
};

/**
 * Cria uma avaliação para um OrderItem entregue.
 */
export async function createReview(payload: {
  order_item: number | string;
  rating: number;
  comment?: string;
  photos?: any[];
}) {
  const formData = new FormData();
  formData.append('order_item', String(payload.order_item));
  formData.append('rating', String(payload.rating));
  if (payload.comment) {
    formData.append('comment', payload.comment.trim());
  }

  if (payload.photos && payload.photos.length > 0) {
    for (let index = 0; index < payload.photos.length; index++) {
      const photoUri = payload.photos[index];
      const filename = photoUri.split('/').pop() || `photo_${index}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      if (typeof window !== 'undefined' && photoUri.startsWith('blob:')) {
        try {
          const res = await fetch(photoUri);
          const blob = await res.blob();
          formData.append('photos', blob, filename);
        } catch {
          formData.append('photos', {
            uri: photoUri,
            name: filename,
            type,
          } as any);
        }
      } else {
        formData.append('photos', {
          uri: photoUri,
          name: filename,
          type,
        } as any);
      }
    }
  }

  const response = await api.post('/reviews/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

/**
 * Edita uma avaliação existente (uma única vez permitida).
 */
export async function updateReview(
  id: number | string,
  payload: { rating?: number; comment?: string; photos?: any[] }
) {
  const formData = new FormData();
  if (payload.rating !== undefined) {
    formData.append('rating', String(payload.rating));
  }
  if (payload.comment !== undefined) {
    formData.append('comment', payload.comment.trim());
  }

  if (payload.photos && payload.photos.length > 0) {
    for (let index = 0; index < payload.photos.length; index++) {
      const photoUri = payload.photos[index];
      // Se já for uma URL remota existente (não é um arquivo local novo), não precisa re-enviar como multipart file
      if (typeof photoUri === 'string' && (photoUri.startsWith('http://') || photoUri.startsWith('https://'))) {
        continue;
      }
      const filename = photoUri.split('/').pop() || `photo_${index}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      if (typeof window !== 'undefined' && photoUri.startsWith('blob:')) {
        try {
          const res = await fetch(photoUri);
          const blob = await res.blob();
          formData.append('photos', blob, filename);
        } catch {
          formData.append('photos', {
            uri: photoUri,
            name: filename,
            type,
          } as any);
        }
      } else {
        formData.append('photos', {
          uri: photoUri,
          name: filename,
          type,
        } as any);
      }
    }
  }

  const response = await api.patch(`/reviews/${id}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function getCustomerReview(id: number | string): Promise<Review> {
  const response = await api.get<Review>(`/reviews/${id}/`);
  return response.data;
}

/**
 * Exclui logicamente uma avaliação.
 */
export async function deleteReview(id: number | string) {
  const response = await api.delete(`/reviews/${id}/`);
  return response.data;
}
