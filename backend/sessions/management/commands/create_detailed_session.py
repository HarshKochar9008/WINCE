"""
Management command to create a single detailed session with dummy data
Includes description, timing details, and is ready for booking with Razorpay integration
"""
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

        # Get or create creator user
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
            # Get first user with CREATOR role, or create a default one
            user = User.objects.filter(role=User.Role.CREATOR).first()
            if not user:
                user = User.objects.first()
                if user:
                    user.role = User.Role.CREATOR
                    user.save()
                    self.stdout.write(self.style.WARNING(f'Updated user {user.email} to CREATOR role'))
            if not user:
                # Create a default user
                user = User.objects.create_user(
                    email='creator@example.com',
                    name='Demo Creator',
                    role=User.Role.CREATOR,
                    password='demo123'
                )
                self.stdout.write(self.style.SUCCESS('Created default creator user: creator@example.com'))

        self.stdout.write(self.style.SUCCESS(f'Using creator: {user.email} ({user.name})'))

        # Detailed session description
        description = """
Welcome to the Advanced Web Development Masterclass! This comprehensive session is designed for developers who want to take their web development skills to the next level.

**What You'll Learn:**
• Modern JavaScript (ES6+) and TypeScript fundamentals
• React.js advanced patterns and state management
• Server-side rendering with Next.js
• RESTful API design and GraphQL integration
• Database optimization and caching strategies
• Authentication and authorization best practices
• Deployment strategies for production applications
• Performance optimization techniques

**Who Should Attend:**
• Intermediate to advanced developers
• Full-stack developers looking to enhance their skills
• Developers preparing for technical interviews
• Team leads wanting to stay updated with modern practices

**Session Format:**
• Live coding demonstrations
• Interactive Q&A sessions
• Hands-on exercises with code examples
• Access to session recordings and resources
• Certificate of completion

**Materials Included:**
• Complete source code repository
• Comprehensive documentation and guides
• Pre-session preparation materials
• Post-session follow-up resources

This session will be conducted via live video conference. You'll receive the meeting link 24 hours before the session starts. All attendees will have lifetime access to the recorded session and materials.

Book now to secure your spot - limited seats available!
        """.strip()

        # Calculate timing
        start_time = timezone.now() + timedelta(days=days, hours=14)  # 2 PM, N days from now
        duration = timedelta(hours=3, minutes=30)  # 3.5 hours session

        # Create session
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
