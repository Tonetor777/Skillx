import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSystemSettings, useUpdateSystemSettings, SystemSettings as SettingsType } from '../../features/settings/api/settings';
import { useAuth } from '../../features/authentication/context/AuthContext';
import { can } from '../../shared/permissions/can';
import { 
  Settings, 
  Save, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2, 
  Server, 
  Database,
  Lock,
  Braces
} from 'lucide-react';
import { motion } from 'motion/react';

const settingsSchema = z.object({
  branding_name: z.string().min(3, { message: 'Branding Name must be at least 3 characters long' }),
  theme: z.enum(['zinc', 'neutral', 'slate', 'stone']),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function PlatformSettings() {
  const { user } = useAuth();

  // Bulletproof gate rule: Admins cannot change platform settings. Only Super Admins can.
  if (!user || !can.manageSettings(user.role)) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-xl max-w-lg mx-auto text-center my-12" id="settings-unauthorized-guard">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold">Access Restrict Guard</h3>
        <p className="text-sm mt-1">
          Admins, Teachers, and Students are restricted from editing global platform settings. Only **Super Admins** can access these parameters.
        </p>
      </div>
    );
  }

  const { data: settings, isLoading, isError, refetch } = useSystemSettings();
  const updateSettingsMutation = useUpdateSystemSettings();
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    values: settings ? {
      branding_name: settings.branding_name,
      theme: settings.theme as any,
    } : {
      branding_name: 'Skilix LMS',
      theme: 'zinc',
    },
  });

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      await updateSettingsMutation.mutateAsync({
        branding_name: data.branding_name,
        theme: data.theme,
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4" id="settings-loading-state">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-gray-500">Retrieving system configuration registry...</p>
      </div>
    );
  }

  // 2. Error State
  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg mx-auto my-12" id="settings-error-state">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-900">Failed to load platform settings</h3>
        <button 
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="settings-view-root">
      {/* Toast Alert Success notification */}
      {showSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white rounded-lg p-4 shadow-xl flex items-center gap-3.5 border border-emerald-500 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-semibold">Settings updated successfully!</span>
        </div>
      )}

      {/* View Header */}
      <div className="border-b border-[#d8d8d4] pb-6">
        <p className="skx-page-label">Platform Settings</p>
        <h1 className="mt-3 text-4xl md:text-5xl skx-amharic-title">የመድረክ ቅንብሮች</h1>
        <p className="mt-2 font-display text-lg font-bold text-[#141414]">Platform Settings</p>
        <p className="text-[#5f5f5a] text-sm mt-2">
          Configure branding guidelines, isolated database settings, and permissions lockdown criteria.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Core Settings Form */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6 space-y-6">
          <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-3">Branding and Core Configuration</h3>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">Platform Organization Name</label>
              <input
                type="text"
                className="mt-1.5 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 text-sm"
                placeholder="e.g. Skilix Academy"
                {...register('branding_name')}
              />
              {errors.branding_name && (
                <span className="text-xs text-red-600 font-medium mt-1 block">{errors.branding_name.message}</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Visual System Palette Vibe</label>
              <select
                className="mt-1.5 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 text-sm"
                {...register('theme')}
              >
                <option value="zinc">Zinc Vibe - Balanced Neutral Accent</option>
                <option value="neutral">Neutral Vibe - Clean & Flat Monochrome</option>
                <option value="slate">Slate Vibe - Cool Technical Slate Accent</option>
                <option value="stone">Stone Vibe - Warm Organic Stone Accent</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Saving settings...' : 'Save Configuration'}
            </button>
          </form>
        </div>

        {/* Info panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
            <h4 className="font-bold text-base text-gray-900 flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-600" />
              Runtime Telemetry
            </h4>
            <div className="space-y-3 font-mono text-xs text-gray-500">
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span>Active Core Gateways:</span>
                <span className="font-semibold text-emerald-600">Online</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span>API Endpoint Proxy:</span>
                <span className="truncate max-w-[140px] text-gray-400">http://localhost:8000/api</span>
              </div>
              <div className="flex justify-between">
                <span>Workspace ID:</span>
                <span className="truncate text-gray-400">e6a7d5e1-6e39...</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
            <h4 className="font-bold text-base text-gray-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600" />
              Security Checkpoints
            </h4>
            <ul className="text-xs text-gray-500 space-y-2.5 leading-relaxed font-sans">
              <li>• Centralized checks are active on all applications, cohorts, and settings routing.</li>
              <li>• Student rosters belong to exactly one isolated active cohort at all times.</li>
              <li>• Grading actions lock submissions immediately to secure scoring results.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
