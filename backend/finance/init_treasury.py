from finance.models import Treasury
if not Treasury.objects.filter(type=Treasury.TreasuryType.DAILY).exists():
    Treasury.objects.create(name="Store Daily Drawer", type=Treasury.TreasuryType.DAILY)
    print("Created Daily Treasury")
if not Treasury.objects.filter(type=Treasury.TreasuryType.MAIN).exists():
    Treasury.objects.create(name="Main Safe", type=Treasury.TreasuryType.MAIN)
    print("Created Main Treasury")
