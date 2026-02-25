from django.test import TestCase
from decimal import Decimal
from brand.models import Product, Category, Order, OrderItem, Location, Inventory, Customer

class ProductTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Tops")

    def test_create_product(self):
        """Test creating a product with basic fields."""
        product = Product.objects.create(
            name="Classic T-Shirt",
            sku="TS-001",
            category=self.category,
            retail_price=Decimal('150.00'),
            standard_cost=Decimal('50.00')
        )
        self.assertEqual(product.name, "Classic T-Shirt")
        self.assertEqual(product.sku, "TS-001")
        self.assertEqual(product.retail_price, Decimal('150.00'))
        self.assertTrue(product.barcode) # Should be auto-generated

    def test_product_str(self):
        product = Product.objects.create(name="Hat", sku="HAT-01", retail_price=50)
        self.assertIn("Hat", str(product))
        self.assertIn("HAT-01", str(product))

class OrderTests(TestCase):
    def setUp(self):
        self.location = Location.objects.create(name="Store 1", type=Location.LocationType.SHOWROOM)
        self.customer = Customer.objects.create(name="John Doe", phone="01012345678")
        self.product = Product.objects.create(name="Jeans", sku="JN-01", retail_price=200)

    def test_create_order(self):
        """Test creating an order with items."""
        order = Order.objects.create(
            customer=self.customer,
            location=self.location,
            total_price=Decimal('400.00'),
            status=Order.OrderStatus.PENDING
        )
        
        # Add items
        OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=2,
            unit_price=self.product.retail_price
        )

        self.assertTrue(order.order_number.startswith("ORD-"))
        self.assertEqual(order.items.count(), 1)
        self.assertEqual(order.items.first().quantity, 2)
        self.assertEqual(order.status, Order.OrderStatus.PENDING)

    def test_inventory_logic_simulation(self):
        """
        Verify that we can link orders to inventory adjustments.
        (Note: The actual deduction logic might be in a Service or View, 
        but we test the Model relationships here).
        """
        # Setup Inventory
        inventory = Inventory.objects.create(
            product=self.product,
            location=self.location,
            quantity=10
        )
        
        # Simulate "Selling" 2 items
        order = Order.objects.create(customer=self.customer, location=self.location, status=Order.OrderStatus.PAID)
        item = OrderItem.objects.create(order=order, product=self.product, quantity=2, unit_price=200)
        
        # Manual deduction as would happen in a view
        inventory.quantity -= item.quantity
        inventory.save()
        
        inventory.refresh_from_db()
        self.assertEqual(inventory.quantity, 8)
