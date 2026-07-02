import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../features/authentication/context/AuthContext';
import { useCohorts } from '../../features/cohorts/api/cohorts';
import apiClient from '../../shared/api/client';
import { 
  Save, 
  Mail, 
  Shield, 
  Users, 
  CheckCircle2, 
  Camera
} from 'lucide-react';

const profileSchema = z.object({
  first_name: z.string().min(2, { message: 'First name must be at least 2 characters long' }),
  last_name: z.string().min(2, { message: 'Last name must be at least 2 characters long' }),
  photo: z.instanceof(FileList).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function MyProfile() {
  const { user, updateUser } = useAuth();
  const { data: cohorts } = useCohorts();
  const [showSuccess, setShowSuccess] = useState(false);

  if (!user) return null;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user.first_name,
      last_name: user.last_name,
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    const formData = new FormData();
    formData.append('first_name', data.first_name);
    formData.append('last_name', data.last_name);
    if (data.photo?.[0]) {
      formData.append('photo', data.photo[0]);
    }

    const updated = await apiClient.patch('/accounts/me/', formData);
    updateUser(updated);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Derive active cohort if Student
  const activeCohort = cohorts?.find(c => c.id === user.cohort_id);

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Administrator',
    teacher: 'Academic Instructor',
    student: 'Student Researcher',
  };

  return (
    <div className="space-y-8" id="profile-view-root">
      {showSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white rounded-lg p-4 shadow-xl flex items-center gap-3.5 border border-emerald-500 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-semibold">Profile details updated successfully!</span>
        </div>
      )}

      {/* View Header */}
      <div className="border-b border-[#d8d8d4] pb-6">
        <p className="skx-page-label">My Profile</p>
        <h1 className="mt-3 text-4xl md:text-5xl skx-amharic-title">የእኔ መገለጫ</h1>
        <p className="mt-2 font-display text-lg font-bold text-[#141414]">My Profile</p>
        <p className="text-[#5f5f5a] text-sm mt-2">
          Review your credentials, enrollments status, and personal preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Card: Summary & Roles badge */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <img 
              src={user.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=140&h=140&q=80"} 
              alt={user.first_name} 
              className="w-24 h-24 rounded-full border-2 border-indigo-100 object-cover"
            />
            <div className="absolute bottom-0 right-1 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center border border-white">
              <Camera className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 font-sans">
              {user.first_name} {user.last_name}
            </h2>
            <p className="text-xs text-gray-400 font-mono mt-1">{user.email}</p>
          </div>

          <div className="w-full pt-4 border-t border-gray-50 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-400 font-semibold flex items-center gap-1.5 uppercase">
                <Shield className="w-3.5 h-3.5 text-indigo-600" /> Authorized Role
              </span>
              <span className="font-bold text-indigo-700 font-sans">{roleLabels[user.role]}</span>
            </div>

            {user.role === 'student' && activeCohort && (
              <div className="flex items-center justify-between text-xs p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-400 font-semibold flex items-center gap-1.5 uppercase">
                  <Users className="w-3.5 h-3.5 text-emerald-600" /> Enrolled Class
                </span>
                <span className="font-bold text-emerald-700 font-sans">{activeCohort.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Editor form & Cohort context */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
            <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-3">Account Details</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    className="mt-1.5 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 text-sm"
                    {...register('first_name')}
                  />
                  {errors.first_name && <span className="text-xs text-red-600 font-medium mt-1 block">{errors.first_name.message}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    className="mt-1.5 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 text-sm"
                    {...register('last_name')}
                  />
                  {errors.last_name && <span className="text-xs text-red-600 font-medium mt-1 block">{errors.last_name.message}</span>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address (Read Only)</label>
                <div className="mt-1.5 relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    disabled
                    className="pl-10 block w-full rounded-lg border-gray-200 bg-gray-50 text-gray-400 text-sm cursor-not-allowed"
                    value={user.email}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white p-2 text-sm shadow-xs focus:border-indigo-500"
                  {...register('photo')}
                />
                <p className="mt-1 text-xs text-gray-400">PNG, JPG, JPEG, or WEBP. Max 5MB.</p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Saving modifications...' : 'Update Profile'}
              </button>
            </form>
          </div>

          {/* Student Syllabus details block */}
          {user.role === 'student' && activeCohort && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-2.5">
                Cohort Registration Checklist
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-400 block font-semibold uppercase">Schedule Term</span>
                  <span className="text-sm font-semibold text-gray-800 block mt-1">
                    {activeCohort.start_date} to {activeCohort.end_date}
                  </span>
                </div>
                <div className="p-3.5 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-400 block font-semibold uppercase">Enrolled Syllabus</span>
                  <span className="text-sm font-semibold text-gray-800 block mt-1">
                    {activeCohort.program_name}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
