interface UserAvatarProps {
  firstName: string;
  lastName?: string;
  src?: string;
  className?: string;
}

const getInitials = (firstName: string, lastName?: string) => {
  const firstInitial = firstName.trim().charAt(0);
  const lastInitial = lastName?.trim().charAt(0) ?? '';
  return `${firstInitial}${lastInitial}`.toUpperCase() || 'U';
};

export default function UserAvatar({ firstName, lastName, src, className = '' }: UserAvatarProps) {
  const classes = `shrink-0 border border-[#d8d8d4] object-cover ${className}`;

  if (src) {
    return (
      <img
        src={src}
        alt={firstName}
        className={classes}
      />
    );
  }

  return (
    <div
      aria-label={firstName}
      className={`flex items-center justify-center bg-[#f3f3f0] font-bold uppercase text-[#5f5f5a] ${classes}`}
    >
      {getInitials(firstName, lastName)}
    </div>
  );
}
