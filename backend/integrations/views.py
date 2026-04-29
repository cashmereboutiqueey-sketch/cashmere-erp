import hashlib
import hmac
import base64

from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ObjectDoesNotExist
from .services import ShopifyService


def _verify_shopify_hmac(request) -> bool:
    """Return True if the request HMAC matches our webhook secret."""
    secret = getattr(settings, 'SHOPIFY_WEBHOOK_SECRET', '')
    if not secret:
        import logging
        logging.getLogger(__name__).error(
            "SHOPIFY_WEBHOOK_SECRET is not configured — rejecting webhook. "
            "Set SHOPIFY_WEBHOOK_SECRET in your environment."
        )
        return False
    hmac_header = request.headers.get('X-Shopify-Hmac-Sha256', '')
    if not hmac_header:
        return False
    digest = hmac.new(secret.encode('utf-8'), request.body, hashlib.sha256).digest()
    computed = base64.b64encode(digest).decode('utf-8')
    return hmac.compare_digest(computed, hmac_header)


class ShopifyOrderWebhook(APIView):
    """
    Endpoint: /api/webhooks/shopify/orders/create/
    Receives 'orders/create' payload from Shopify.
    """
    permission_classes = []

    def post(self, request):
        if not _verify_shopify_hmac(request):
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            ShopifyService.process_order_webhook(request.data)
            return Response({"status": "received"}, status=status.HTTP_200_OK)
        except ObjectDoesNotExist as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": "Internal Server Error", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
