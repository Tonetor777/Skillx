import nexusAcademyLogo from '../../../assets/branding/nexus-academy-logo.jpg';
import nexusAcademyIconWhiteOnBlack from '../../../assets/branding/nexus-academy-x-white-on-black.png';

interface BrandLogoProps {
  variant?: 'icon' | 'full';
  className?: string;
}

export default function BrandLogo({ variant = 'icon', className = '' }: BrandLogoProps) {
  if (variant === 'full') {
    return (
      <img
        src={nexusAcademyLogo}
        alt="Nexus Academy"
        className={`object-contain ${className}`}
      />
    );
  }

  return (
    <img
      src={nexusAcademyIconWhiteOnBlack}
      alt="Nexus Academy"
      className={`border border-[#141414] object-cover ${className}`}
    />
  );
}
