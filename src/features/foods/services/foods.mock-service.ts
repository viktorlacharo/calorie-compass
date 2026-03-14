const MOCK_NETWORK_DELAY = 120;

export async function simulateFoodsRequest<T>(resolver: () => T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_NETWORK_DELAY));
  return resolver();
}
