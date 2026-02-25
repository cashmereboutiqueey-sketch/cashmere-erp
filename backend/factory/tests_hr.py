from django.test import TestCase
from django.db.utils import IntegrityError
from django.utils import timezone
from decimal import Decimal
from factory.models import Worker, WorkerAttendance, ProductionLog, ProductionJob
from brand.models import Product

class HRTests(TestCase):
    def setUp(self):
        self.worker = Worker.objects.create(name="Ahmed Worker", role="Seamstress", hourly_rate=Decimal('25.00'))

    def test_create_worker(self):
        self.assertEqual(self.worker.name, "Ahmed Worker")
        self.assertTrue(self.worker.active)
        self.assertEqual(self.worker.hourly_rate, Decimal('25.00'))

    def test_log_attendance(self):
        """Test logging daily attendance."""
        today = timezone.now().date()
        attendance = WorkerAttendance.objects.create(
            worker=self.worker,
            date=today,
            hours_worked=Decimal('8.5')
        )
        self.assertEqual(attendance.hours_worked, Decimal('8.5'))
        
        # Test Uniqueness (Worker + Date)
        with self.assertRaises(IntegrityError):
            WorkerAttendance.objects.create(
                worker=self.worker,
                date=today,
                hours_worked=Decimal('5.0')
            )

    def test_log_production(self):
        """Test logging production output."""
        # Create a Job first
        product = Product.objects.create(name="Scarf", sku="SC-01")
        job = ProductionJob.objects.create(name="JOB-HR-01", product=product, quantity=50)
        
        log = ProductionLog.objects.create(
            worker=self.worker,
            job=job,
            quantity=10,
            date=timezone.now().date()
        )
        
        self.assertEqual(log.quantity, 10)
        self.assertEqual(log.job, job)
        self.assertEqual(log.worker, self.worker)
