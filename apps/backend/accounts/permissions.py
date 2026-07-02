from rest_framework.permissions import BasePermission

from accounts.choices import UserRole, UserStatus


class IsActiveUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.status == UserStatus.ACTIVE)


class HasRole(BasePermission):
    allowed_roles: set[str] = set()

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.status == UserStatus.ACTIVE
            and request.user.role in self.allowed_roles
        )


class IsAdminOrSuperAdmin(HasRole):
    allowed_roles = {UserRole.ADMIN, UserRole.SUPER_ADMIN}


class IsTeacherAdminOrSuperAdmin(HasRole):
    allowed_roles = {UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN}


class IsSuperAdmin(HasRole):
    allowed_roles = {UserRole.SUPER_ADMIN}


class IsTeacher(HasRole):
    allowed_roles = {UserRole.TEACHER}


class IsStudent(HasRole):
    allowed_roles = {UserRole.STUDENT}
