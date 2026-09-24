export const processedWebhookEvents = new Set<string>();

export function clearProcessedWebhookEvents(): void {
  processedWebhookEvents.clear();
}
