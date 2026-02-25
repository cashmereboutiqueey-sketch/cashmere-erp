from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ObjectDoesNotExist
from .services import ShopifyService

class ShopifyOrderWebhook(APIView):
    """
    Endpoint: /api/webhooks/shopify/orders/create/
    Receives 'orders/create' payload from Shopify.
    """
    permission_classes = [] # Public endpoint, secured by Signature (TODO)

    def post(self, request):
        payload = request.data
        
        # TODO: HMAC Signature Verification
        # hmac_header = request.headers.get('X-Shopify-Hmac-Sha256')
        
        try:
            ShopifyService.process_order_webhook(payload)
            return Response({"status": "received"}, status=status.HTTP_200_OK)
        except ObjectDoesNotExist as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # Log full exception
            return Response({"error": "Internal Server Error", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
