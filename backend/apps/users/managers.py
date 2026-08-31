from django.contrib.auth.base_user import BaseUserManager


class CustomUserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(
        self,
        email,
        first_name,
        last_name="",
        phone="",
        password=None,
        role="CUSTOMER",
        **extra_fields,
    ):
        if not email:
            raise ValueError("O e-mail é obrigatório.")

        if not first_name:
            raise ValueError("O primeiro nome é obrigatório.")

        email = self.normalize_email(email)

        user = self.model(
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role=role,
            **extra_fields,
        )

        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(
        self,
        email,
        first_name,
        last_name="",
        phone="",
        password=None,
        **extra_fields,
    ):
        extra_fields.setdefault("role", "ADMIN")
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("role") != "ADMIN":
            raise ValueError("Superusuário deve possuir role ADMIN.")

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superusuário deve possuir is_staff=True.")

        if extra_fields.get("is_superuser") is not True:
            raise ValueError(
                "Superusuário deve possuir is_superuser=True."
            )

        return self.create_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            password=password,
            **extra_fields,
        )