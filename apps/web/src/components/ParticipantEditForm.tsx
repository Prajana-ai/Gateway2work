'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/use-api';
import { useQueryClient } from '@tanstack/react-query';

interface ParticipantEditFormProps {
  participant: any;
  onSubmitSuccess: () => void;
  onCancel: () => void;
}

const sections = [
  { id: 'identity', label: '1. Identity & Contact' },
  { id: 'legal', label: '2. Legal Details' },
  { id: 'demographics', label: '3. Demographics' },
  { id: 'socioeconomic', label: '4. Socioeconomic Status' },
];

const referralSources = [
  { value: '', label: 'Select a source...' },
  { value: 'jail', label: 'Jail' },
  { value: 'court', label: 'Court' },
  { value: 'self', label: 'Self' },
  { value: 'provider', label: 'Provider' },
  { value: 'other', label: 'Other' },
];

export function ParticipantEditForm({ participant, onSubmitSuccess, onCancel }: ParticipantEditFormProps) {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('identity');
  const [showSuccess, setShowSuccess] = useState(false);
  
  const demographics = participant?.demographics || {};
  const legal_info = participant?.legal_info || {};
  const socioeconomic = participant?.socioeconomic || {};

  // Helper to format date string to YYYY-MM-DD for input fields without timezone shift
  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Helper to initialize race as an array
  const initialRace: string[] = Array.isArray(demographics?.race) 
    ? demographics.race 
    : demographics?.race ? [demographics.race] : [];

  const [form, setForm] = useState({
    participantId: participant?.participant_id || '',
    externalEhrId: participant?.external_ehr_id || '',
    firstName: demographics?.first_name || '',
    lastName: demographics?.last_name || '',
    preferredName: demographics?.preferred_name || '',
    dob: formatDateForInput(demographics?.date_of_birth),
    primaryLanguage: demographics?.primary_language || '',
    phone: demographics?.phone || '',
    email: demographics?.email || '',
    preferredContactMethod: demographics?.preferred_contact_method || '',
    address: demographics?.address || '',
    city: demographics?.city || '',
    county: demographics?.county || '',
    zipCode: demographics?.zip_code || '',
    emergencyContactName: demographics?.emergency_contact_name || '',
    emergencyContactPhone: demographics?.emergency_contact_phone || '',
    consentSigned: legal_info?.consent_signed || false,
    consentDate: formatDateForInput(legal_info?.consent_date),
    roiSigned: legal_info?.roi_signed || false,
    roiSignedDate: legal_info?.roi_expiration_date ? new Date(new Date(legal_info.roi_expiration_date).setFullYear(new Date(legal_info.roi_expiration_date).getFullYear() - 1)).toISOString().split('T')[0] : '',
    roiExpirationDate: formatDateForInput(legal_info?.roi_expiration_date),
    status: participant?.status || 'active',
    staffAssigned: legal_info?.staff_assigned || '',
    caseManagerAssigned: legal_info?.case_manager_assigned || '',
    gender: demographics?.gender || '',
    genderOther: '',
    pronouns: demographics?.pronouns || '',
    race: initialRace,
    raceOther: '',
    ethnicity: demographics?.ethnicity || '',
    veteranStatus: demographics?.veteran_status || '',
    disabilityStatus: demographics?.disability_status || '',
    citizenshipStatus: demographics?.citizenship_status || '',
    householdSize: demographics?.household_size?.toString() || '1',
    dependentsCount: demographics?.dependents_count?.toString() || '0',
    parentingStatus: demographics?.parenting_status || '',
    maritalStatus: demographics?.marital_status || '',
    housingStatusAtIntake: socioeconomic?.housing_status_at_intake || '',
    residenceType: socioeconomic?.residence_type || '',
    transportationAccess: socioeconomic?.transportation_access || '',
    needsDriversLicense: socioeconomic?.needs_drivers_license || false,
    internetAccess: socioeconomic?.internet_access || '',
    deviceAccess: socioeconomic?.device_access || '',
  });

  const updateParticipant = useApiMutation(
    `/participants/${participant.id}`,
    'patch',
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['participant', participant.id] });
        queryClient.invalidateQueries({ queryKey: ['participants'] });
        queryClient.invalidateQueries({ queryKey: ['referrals'] });
        queryClient.invalidateQueries({ queryKey: ['reports'] });
        setShowSuccess(true);
        setTimeout(() => {
          onSubmitSuccess();
        }, 1500);
      },
    },
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (name === 'roiSignedDate') {
      const expirationDate = value ? new Date(new Date(value).setFullYear(new Date(value).getFullYear() + 1)).toISOString().split('T')[0] : '';
      setForm(prev => ({
        ...prev,
        roiSignedDate: value,
        roiExpirationDate: expirationDate
      }));
      return;
    }

    if (name === 'race') {
      setForm(prev => {
        const currentRaces = [...prev.race];
        if (checked) {
          return { ...prev, race: [...currentRaces, value] };
        } else {
          return { ...prev, race: currentRaces.filter(r => r !== value) };
        }
      });
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function handleNext() {
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1].id);
    }
  }

  function handlePrevious() {
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1].id);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Process race array to handle 'Other' value
    const finalRaces = form.race.map(r => 
      r === 'Other' && form.raceOther ? `Other: ${form.raceOther}` : r
    );

    const payload = {
      participant_id: form.participantId.trim() || null,
      external_ehr_id: form.externalEhrId.trim() || null,
      status: form.status,
      demographics: {
        first_name: form.firstName,
        last_name: form.lastName,
        preferred_name: form.preferredName || null,
        date_of_birth: form.dob,
        primary_language: form.primaryLanguage || null,
        phone: form.phone || null,
        email: form.email || null,
        preferred_contact_method: form.preferredContactMethod || null,
        address: form.address || null,
        city: form.city || null,
        county: form.county || null,
        zip_code: form.zipCode || null,
        emergency_contact_name: form.emergencyContactName || null,
        emergency_contact_phone: form.emergencyContactPhone || null,
        gender: form.gender || null,
        pronouns: null,
        race: finalRaces.length > 0 ? finalRaces : null,
        ethnicity: form.ethnicity || null,
        veteran_status: form.veteranStatus || null,
        disability_status: form.disabilityStatus || null,
        citizenship_status: form.citizenshipStatus || null,
        household_size: parseInt(form.householdSize, 10),
        dependents_count: parseInt(form.dependentsCount, 10),
        parenting_status: form.parentingStatus || null,
        marital_status: form.maritalStatus || null,
      },
      legal_info: {
        consent_signed: form.consentSigned,
        consent_date: form.consentDate || null,
        roi_signed: form.roiSigned,
        roi_expiration_date: form.roiExpirationDate || null,
        staff_assigned: form.staffAssigned || null,
        case_manager_assigned: form.caseManagerAssigned || null,
      },
      socioeconomic: {
        housing_status_at_intake: form.housingStatusAtIntake || null,
        residence_type: form.residenceType || null,
        transportation_access: form.transportationAccess || null,
        needs_drivers_license: form.needsDriversLicense,
        internet_access: form.internetAccess || null,
        device_access: form.deviceAccess || null,
      },
      consent_42cfr: form.consentSigned,
      consent_expires_at: form.roiExpirationDate || null,
    };

    updateParticipant.mutate(payload);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex gap-1 border-b mb-6 overflow-x-auto no-scrollbar">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSection(s.id)}
            className={`px-4 py-2 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
              activeSection === s.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Main Form Content */}
      <form id="participant-edit-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 space-y-6">
        {showSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span className="text-sm font-bold">Changes saved successfully!</span>
          </div>
        )}
        {activeSection === 'identity' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Participant ID</label>
                <div className="flex gap-2">
                  <input name="participantId" className="input-field flex-1 font-mono text-blue-700" value={form.participantId} onChange={handleInputChange} />
                  <button
                    type="button"
                    onClick={() => {
                      const prefix = 'IF';
                      const random = Math.floor(1000 + Math.random() * 9000);
                      const date = new Date().getFullYear().toString().slice(-2);
                      setForm(prev => ({ ...prev, participantId: `${prefix}-${date}-${random}` }));
                    }}
                    className="btn-secondary text-[10px] whitespace-nowrap"
                  >
                    Auto-Generate
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">External EHR ID</label>
                <input name="externalEhrId" className="input-field w-full font-mono" value={form.externalEhrId} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">First Name</label>
                <input name="firstName" required className="input-field w-full" value={form.firstName} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Name</label>
                <input name="lastName" required className="input-field w-full" value={form.lastName} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Preferred Name</label>
                <input name="preferredName" className="input-field w-full" value={form.preferredName} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date of Birth</label>
                <input name="dob" type="date" required className="input-field w-full" value={form.dob} onChange={handleInputChange} />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Primary Language</label>
                <input name="primaryLanguage" className="input-field w-full" value={form.primaryLanguage} onChange={handleInputChange} />
              </div>
            </div>
            <div className="border-t pt-4 grid grid-cols-2 gap-4">
               <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                <input name="email" type="email" className="input-field w-full" value={form.email} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</label>
                <input name="phone" type="tel" className="input-field w-full" value={form.phone} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Method</label>
                <select name="preferredContactMethod" className="input-field w-full" value={form.preferredContactMethod} onChange={handleInputChange}>
                  <option value="">Select...</option>
                  <option value="phone">Phone</option>
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                </select>
              </div>
            </div>
             <div className="border-t pt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mailing Address</label>
                <input name="address" className="input-field w-full" value={form.address} onChange={handleInputChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">City</label>
                  <input name="city" className="input-field w-full" value={form.city} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">County</label>
                  <input name="county" className="input-field w-full" value={form.county} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ZIP Code</label>
                  <input name="zipCode" className="input-field w-full" value={form.zipCode} onChange={handleInputChange} />
                </div>
              </div>
            </div>
            <div className="border-t pt-4 grid grid-cols-2 gap-4">
               <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Emergency Contact Name</label>
                <input name="emergencyContactName" className="input-field w-full" value={form.emergencyContactName} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Emergency Contact Phone</label>
                <input name="emergencyContactPhone" type="tel" className="input-field w-full" value={form.emergencyContactPhone} onChange={handleInputChange} />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'legal' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Global Status</label>
                <select name="status" className="input-field w-full font-bold" value={form.status} onChange={handleInputChange}>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="declined">Declined</option>
                </select>
              </div>
            </div>
            <div className="border-t pt-4 space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input name="consentSigned" type="checkbox" className="rounded text-blue-600" checked={form.consentSigned} onChange={handleInputChange} />
                <span className="text-sm font-bold text-slate-700">Consent Signed</span>
              </label>
              {form.consentSigned && (
                <div className="pl-6">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Consent Date</label>
                  <input name="consentDate" type="date" className="input-field max-w-xs" value={form.consentDate} onChange={handleInputChange} />
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input name="roiSigned" type="checkbox" className="rounded text-blue-600" checked={form.roiSigned} onChange={handleInputChange} />
                <span className="text-sm font-bold text-slate-700">ROI Signed</span>
              </label>
              {form.roiSigned && (
                <div className="pl-6">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ROI Signed Date</label>
                  <input name="roiSignedDate" type="date" className="input-field max-w-xs" value={form.roiSignedDate} onChange={handleInputChange} />
                  {form.roiExpirationDate && (
                    <p className="mt-1 text-xs italic text-slate-500">
                      ROI expires on {form.roiExpirationDate}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="border-t pt-4 grid grid-cols-2 gap-4">
               <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Staff Assigned</label>
                <input name="staffAssigned" className="input-field w-full" value={form.staffAssigned} onChange={handleInputChange} />
              </div>
               <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Case Manager</label>
                <input name="caseManagerAssigned" className="input-field w-full" value={form.caseManagerAssigned} onChange={handleInputChange} />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'demographics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gender</label>
                <input
                  name="gender"
                  type="text"
                  className="input-field w-full"
                  placeholder="Enter gender"
                  value={form.gender}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Race (Select all that apply)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {[
                    'American Indian or Alaska Native',
                    'Asian',
                    'Black or African American',
                    'Native Hawaiian or Other Pacific Islander',
                    'White',
                    'Other',
                    'Decline to state'
                  ].map((r) => (
                    <label key={r} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        name="race"
                        value={r}
                        checked={form.race.includes(r)}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      />
                      <span className="text-[11px] text-slate-700 group-hover:text-slate-900 transition-colors">{r}</span>
                    </label>
                  ))}
                </div>
                {form.race.includes('Other') && (
                  <input
                    name="raceOther"
                    type="text"
                    className="input-field mt-2 w-full"
                    placeholder="Please specify race"
                    value={form.raceOther}
                    onChange={handleInputChange}
                  />
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Ethnicity</label>
                <div className="flex gap-4 p-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="ethnicity" 
                      value="Hispanic/Latino" 
                      checked={form.ethnicity === 'Hispanic/Latino'} 
                      onChange={handleInputChange}
                      className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-600"
                    />
                    <span className="text-[11px] text-slate-700 group-hover:text-slate-900">Hispanic/Latino</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="ethnicity" 
                      value="Non-Hispanic/Latino" 
                      checked={form.ethnicity === 'Non-Hispanic/Latino'} 
                      onChange={handleInputChange}
                      className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-600"
                    />
                    <span className="text-[11px] text-slate-700 group-hover:text-slate-900">Non-Hispanic/Latino</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Veteran Status</label>
                <select name="veteranStatus" className="input-field w-full" value={form.veteranStatus} onChange={handleInputChange}>
                  <option value="">Select...</option>
                  <option value="Non-Veteran">Non-Veteran</option>
                  <option value="Active Duty">Active Duty</option>
                  <option value="Veteran - Honorable Discharge">Veteran - Honorable Discharge</option>
                  <option value="Veteran - Other">Other Veteran Status</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Disability Status</label>
                <select name="disabilityStatus" className="input-field w-full" value={form.disabilityStatus} onChange={handleInputChange}>
                  <option value="">Select...</option>
                  <option value="No Disability">No Disability</option>
                  <option value="Physical / Mobility">Physical / Mobility</option>
                  <option value="Mental Health / Psychiatric">Mental Health / Psychiatric</option>
                  <option value="Intellectual / Developmental">Intellectual / Developmental</option>
                  <option value="Multiple Disabilities">Multiple</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Citizenship</label>
                <select name="citizenshipStatus" className="input-field w-full" value={form.citizenshipStatus} onChange={handleInputChange}>
                  <option value="">Select...</option>
                  <option value="U.S. Citizen">U.S. Citizen</option>
                  <option value="Permanent Resident">Permanent Resident</option>
                  <option value="Work Authorization">Work Authorization</option>
                  <option value="Refugee / Asylee">Refugee / Asylee</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Marital Status</label>
                <select name="maritalStatus" className="input-field w-full" value={form.maritalStatus} onChange={handleInputChange}>
                  <option value="">Select...</option>
                  <option value="Single (Never Married)">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Separated">Separated</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Domestic Partnership">Domestic Partnership</option>
                </select>
              </div>
            </div>

            <div className="border-t pt-4 grid grid-cols-2 gap-4">
               <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Household Size</label>
                <input name="householdSize" type="number" className="input-field w-full" value={form.householdSize} onChange={handleInputChange} />
              </div>
               <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dependents</label>
                <input name="dependentsCount" type="number" className="input-field w-full" value={form.dependentsCount} onChange={handleInputChange} />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Parenting Status</label>
                <select name="parentingStatus" className="input-field w-full" value={form.parentingStatus} onChange={handleInputChange}>
                  <option value="">Select...</option>
                  <option value="Not a Parent/Guardian">Not a Parent/Guardian</option>
                  <option value="Single Parent/Guardian">Single Parent/Guardian</option>
                  <option value="Co-parenting">Co-parenting</option>
                  <option value="Expectant Parent">Expectant Parent</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'socioeconomic' && (
          <div className="space-y-6">
             <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Housing Status</label>
              <select name="housingStatusAtIntake" className="input-field w-full" value={form.housingStatusAtIntake} onChange={handleInputChange}>
                <option value="">Select...</option>
                <option value="Permanent Housing (Owned or Rented)">Permanent Housing</option>
                <option value="Staying with Friends/Family">Staying with Friends/Family</option>
                <option value="Emergency Shelter">Emergency Shelter</option>
                <option value="Transitional Housing">Transitional Housing</option>
                <option value="Hotel / Motel">Hotel / Motel</option>
                <option value="Unsheltered">Unsheltered</option>
                <option value="At Risk of Eviction">At Risk of Eviction</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Residence Type</label>
              <select name="residenceType" className="input-field w-full" value={form.residenceType} onChange={handleInputChange}>
                <option value="">Select...</option>
                <option value="rural">Rural</option>
                <option value="suburban">Suburban</option>
                <option value="urban">Urban</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Transportation</label>
                <select name="transportationAccess" className="input-field w-full" value={form.transportationAccess} onChange={handleInputChange}>
                  <option value="">Select...</option>
                  <option value="Personal Vehicle (Auto/Motorcycle)">Personal Vehicle</option>
                  <option value="Public Transit">Public Transit</option>
                  <option value="Rideshare (Uber/Lyft/Carpool)">Rideshare</option>
                  <option value="Active Transport (Bicycle/Walking)">Active Transport</option>
                  <option value="No Reliable Transportation">No Reliable Transportation</option>
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input name="needsDriversLicense" type="checkbox" className="rounded text-blue-600" checked={form.needsDriversLicense} onChange={handleInputChange} />
                  <span className="text-xs font-bold text-slate-700">Driver's License?</span>
                </label>
              </div>
            </div>
            <div className="border-t pt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Internet Access</label>
                <select name="internetAccess" className="input-field w-full" value={form.internetAccess} onChange={handleInputChange}>
                  <option value="">Select...</option>
                  <option value="Reliable Home High-Speed">Reliable Home High-Speed</option>
                  <option value="Mobile Data Only">Mobile Data Only</option>
                  <option value="Public Access Only">Public Access Only</option>
                  <option value="No Access">No Access</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Device Access</label>
                <select name="deviceAccess" className="input-field w-full" value={form.deviceAccess} onChange={handleInputChange}>
                  <option value="">Select...</option>
                  <option value="Personal Laptop / Desktop">Personal Laptop / Desktop</option>
                  <option value="Personal Tablet">Personal Tablet</option>
                  <option value="Smartphone Only">Smartphone Only</option>
                  <option value="No Personal Device">No Personal Device</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Footer */}
      <div className="flex justify-between items-center pt-6 border-t mt-auto">
        <div>
          {activeSection !== 'identity' && (
            <button
              key="btn-prev"
              type="button"
              onClick={handlePrevious}
              className="btn-secondary text-xs px-4 py-2"
            >
              Previous
            </button>
          )}
        </div>
        
        <div className="flex gap-3">
          {activeSection !== 'socioeconomic' ? (
            <button
              key="btn-next"
              type="button"
              onClick={handleNext}
              className="btn-primary text-xs px-6 py-2"
            >
              Next
            </button>
          ) : (
            <button
              key="btn-save"
              type="submit"
              form="participant-edit-form"
              disabled={updateParticipant.isPending}
              className="btn-primary text-xs px-6 py-2"
            >
              {updateParticipant.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
