from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from sessions.models import Session

User = get_user_model()


class Command(BaseCommand):
    help = 'Add dummy sessions to the database for a user'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Email of the user to add sessions for. If not provided, uses the first user or creates one.',
        )
        parser.add_argument(
            '--count',
            type=int,
            default=5,
            help='Number of dummy sessions to create (default: 5)',
        )

    def handle(self, *args, **options):
        email = options.get('email')
        count = options.get('count', 5)

        # Get or create user
        if email:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'name': email.split('@')[0].title(),
                    'role': User.Role.CREATOR,
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created user: {email}'))
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
                    password='dummy123'
                )
                self.stdout.write(self.style.SUCCESS('Created default user: creator@example.com'))

        self.stdout.write(self.style.SUCCESS(f'Using user: {user.email}'))

        # Dummy session data
        dummy_sessions = [
            {
                'title': 'Introduction to Web Development',
                'description': 'Learn the fundamentals of web development including HTML, CSS, and JavaScript. Perfect for beginners!',
                'price': Decimal('999.00'),
                'duration': timedelta(hours=2),
                'image': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
            },
            {
                'title': 'Advanced React Patterns',
                'description': 'Deep dive into advanced React patterns, hooks, and performance optimization techniques.',
                'price': Decimal('1499.00'),
                'duration': timedelta(hours=3),
                'image': 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
            },
            {
                'title': 'Python for Data Science',
                'description': 'Comprehensive guide to using Python for data analysis, visualization, and machine learning.',
                'price': Decimal('1299.00'),
                'duration': timedelta(hours=2, minutes=30),
                'image': 'https://images.unsplash.com/photo-1529107386315-e3a9b581bc78?w=800',
            },
            {
                'title': 'UI/UX Design Fundamentals',
                'description': 'Master the principles of user interface and user experience design with hands-on projects.',
                'price': Decimal('1199.00'),
                'duration': timedelta(hours=2),
                'image': 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800',
            },
            {
                'title': 'Full-Stack Development Workshop',
                'description': 'Build a complete full-stack application from scratch using modern technologies and best practices.',
                'price': Decimal('1999.00'),
                'duration': timedelta(hours=4),
                'image': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
            },
            {
                'title': 'DevOps and CI/CD Pipeline',
                'description': 'Learn how to set up automated deployment pipelines and DevOps practices for your projects.',
                'price': Decimal('1699.00'),
                'duration': timedelta(hours=3),
                'image': 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800',
            },
            {
                'title': 'Mobile App Development with React Native',
                'description': 'Create cross-platform mobile applications using React Native and modern development tools.',
                'price': Decimal('1799.00'),
                'duration': timedelta(hours=3, minutes=30),
                'image': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
            },
            {
                'title': 'Cloud Computing Basics',
                'description': 'Introduction to cloud computing platforms, services, and deployment strategies.',
                'price': Decimal('1399.00'),
                'duration': timedelta(hours=2),
                'image': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
            },
        ]

        created_count = 0
        base_time = timezone.now() + timedelta(days=7)  # Start sessions 7 days from now

        for i in range(count):
            session_data = dummy_sessions[i % len(dummy_sessions)]
            start_time = base_time + timedelta(days=i * 2, hours=i * 3)

            session = Session.objects.create(
                title=f"{session_data['title']} (Session {i + 1})",
                description=session_data['description'],
                price=session_data['price'],
                creator=user,
                image=session_data['image'],
                start_time=start_time,
                duration=session_data['duration'],
            )
            created_count += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f'Created session: {session.title} (starts {start_time.strftime("%Y-%m-%d %H:%M")})'
                )
            )

        self.stdout.write(
            self.style.SUCCESS(f'\nSuccessfully created {created_count} dummy sessions for {user.email}')
        )
