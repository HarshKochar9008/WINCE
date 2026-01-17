
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from sessions.models import Session

User = get_user_model()

class Command(BaseCommand):
    help = 'Create a single detailed session with dummy data, description, and timing options for booking with Razorpay'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Email of the creator user. If not provided, uses the first CREATOR user or creates one.',
        )
        parser.add_argument(
            '--title',
            type=str,
            default='Advanced Web Development Masterclass',
            help='Title of the session (default: Advanced Web Development Masterclass)',
        )
        parser.add_argument(
            '--price',
            type=float,
            default=2499.00,
            help='Price of the session in INR (default: 2499.00)',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=7,
            help='Number of days from now to schedule the session (default: 7)',
        )

    def handle(self, *args, **options):
        email = options.get('email')
        title = options.get('title')
        price = Decimal(str(options.get('price')))
        days = options.get('days')

        if email:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'name': email.split('@')[0].title(),
                    'role': User.Role.CREATOR,
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created creator user: {email}'))
        else:

            user = User.objects.filter(role=User.Role.CREATOR).first()
            if not user:
                user = User.objects.first()
                if user:
                    user.role = User.Role.CREATOR
                    user.save()
                    self.stdout.write(self.style.WARNING(f'Updated user {user.email} to CREATOR role'))
            if not user:

                user = User.objects.create_user(
                    email='creator@example.com',
                    name='Demo Creator',
                    role=User.Role.CREATOR,
                    password='demo123'
                )
                self.stdout.write(self.style.SUCCESS('Created default creator user: creator@example.com'))

        self.stdout.write(self.style.SUCCESS(f'Using creator: {user.email} ({user.name})'))

        description = .strip()

        start_time = timezone.now() + timedelta(days=days, hours=14)
        duration = timedelta(hours=3, minutes=30)

        session = Session.objects.create(
            title=title,
            description=description,
            price=price,
            creator=user,
            image='https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80',
            start_time=start_time,
            duration=duration,
        )

        self.stdout.write(self.style.SUCCESS('\n' + '='*70))
        self.stdout.write(self.style.SUCCESS('Session Created Successfully!'))
        self.stdout.write(self.style.SUCCESS('='*70))
        self.stdout.write(self.style.SUCCESS(f'\nSession ID: {session.id}'))
        self.stdout.write(self.style.SUCCESS(f'Title: {session.title}'))
        self.stdout.write(self.style.SUCCESS(f'Price: ₹{session.price}'))
        self.stdout.write(self.style.SUCCESS(f'Start Time: {start_time.strftime("%Y-%m-%d %H:%M %Z")}'))
        self.stdout.write(self.style.SUCCESS(f'Duration: {duration}'))
        self.stdout.write(self.style.SUCCESS(f'Creator: {user.name} ({user.email})'))
        self.stdout.write(self.style.SUCCESS(f'\nView session at: /api/sessions/{session.id}/'))
        self.stdout.write(self.style.SUCCESS('\n' + '='*70))
        self.stdout.write(self.style.SUCCESS('\nThe session is ready for booking with Razorpay integration!'))
        self.stdout.write(self.style.SUCCESS('Users can book this session and complete payment through Razorpay.'))
        self.stdout.write(self.style.SUCCESS('='*70 + '\n'))
