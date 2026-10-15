'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiMutation } from '@/hooks/use-api';

interface NewParticipant {
  participant: {
    id: string;
  };
  duplicates: any[];
}

interface ParticipantFormData {
  // Category 1: Identity & Contact
  participantId: string;
  externalEhrId: string;
  firstName: string;
  lastName: string;
  preferredName: string;
  dob: string;
  primaryLanguage: string;
  phone: string;
  email: string;
  preferredContactMethod: string;
  address: string;
  city: string;
  county: string;
  zipCode: string;
  emergencyContactName: string;
  emergencyContactPhone: string;

  // Category 2: Referral & Legal
  consentSigned: boolean;
  consentDate: string;
  roiSigned: boolean;
  roiSignedDate: string;
  roiExpirationDate: string;
  status: string; // active/inactive
  staffAssigned: string;
  caseManagerAssigned: string;

  // Category 3: Demographics
  gender: string;
  genderOther: string;
  pronouns: string;
  race: string[];
  raceOther: string;
  ethnicity: string;
  veteranStatus: string;
  disabilityStatus: string;
  citizenshipStatus: string;
  householdSize: string;
  dependentsCount: string;
  parentingStatus: string;
  maritalStatus: string;

  // Category 4: Socioeconomic Status
  housingStatusAtIntake: string;
  residenceType: string;
  transportationAccess: string;
  needsDriversLicense: boolean;
  internetAccess: string;
  deviceAccess: string;
}

const sections = [
  { id: 'identity', label: '1. Identity & Contact' },
  { id: 'referral', label: '2. Referral & Legal' },
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

export default function NewParticipantPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('identity');
  const [form, setForm] = useState<ParticipantFormData>({
    participantId: '',
    externalEhrId: '',
    firstName: '',
    lastName: '',
    preferredName: '',
    dob: '',
    primaryLanguage: '',
    phone: '',
    email: '',
    preferredContactMethod: '',
    address: '',
    city: '',
    county: '',
    zipCode: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    consentSigned: false,
    consentDate: '',
    roiSigned: false,
    roiSignedDate: '',
    roiExpirationDate: '',
    status: 'active',
    staffAssigned: '',
    caseManagerAssigned: '',
    gender: '',
    genderOther: '',
    pronouns: '',
    race: [],
    raceOther: '',
    ethnicity: '',
    veteranStatus: '',
    disabilityStatus: '',
    citizenshipStatus: '',
    householdSize: '1',
    dependentsCount: '0',
    parentingStatus: '',
    maritalStatus: '',
    housingStatusAtIntake: '',
    residenceType: '',
    transportationAccess: '',
    needsDriversLicense: false,
    internetAccess: '',
    deviceAccess: '',
  });

  const createParticipant = useApiMutation<NewParticipant, any>(
    '/participants',
    'post',
    {
      onSuccess: (data) => {
        router.push(`/participants/${data.participant.id}?created=true`);
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

  function generateParticipantId() {
    const prefix = 'IF';
    const random = Math.floor(1000 + Math.random() * 9000);
    const date = new Date().getFullYear().toString().slice(-2);
    setForm(prev => ({ ...prev, participantId: `${prefix}-${date}-${random}` }));
  }

  function handleNext() {
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handlePrevious() {
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Process race array to handle 'Other' value
    const finalRaces = form.race.map(r => 
      r === 'Other' ? `Other: ${form.raceOther}` : r
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
        household_size: form.householdSize ? parseInt(form.householdSize, 10) : 1,
        dependents_count: form.dependentsCount ? parseInt(form.dependentsCount, 10) : 0,
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

    createParticipant.mutate(payload);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-2 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Add New Participant</h1>
        </div>
        <div className="flex gap-3">
           <button
            type="button"
            className="btn-secondary"
            onClick={() => router.back()}
          >
            Cancel
          </button>
          <button
            form="participant-form"
            type="submit"
            className="btn-primary"
            disabled={createParticipant.isPending}
          >
            {createParticipant.isPending ? 'Creating...' : 'Create Participant'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeSection === s.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Form Content */}
        <main className="flex-1 overflow-y-auto pr-2 pb-12">
          <form id="participant-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. Identity & Contact */}
            {activeSection === 'identity' && (
              <div className="card space-y-6">
                <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Identity & Contact</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="participantId" className="block text-sm font-medium text-slate-700 mb-1">
                      Participant ID
                    </label>
                    <div className="flex gap-2 max-w-md">
                      <input
                        id="participantId"
                        name="participantId"
                        type="text"
                        className="input-field flex-1 font-mono"
                        placeholder="e.g. IF-26-1001"
                        value={form.participantId}
                        onChange={handleInputChange}
                      />
                      <button
                        type="button"
                        onClick={generateParticipantId}
                        className="btn-secondary whitespace-nowrap"
                      >
                        Auto-Generate
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Unique identifier for the participant (manual or auto).</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                    <input name="firstName" required className="input-field" value={form.firstName} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                    <input name="lastName" required className="input-field" value={form.lastName} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Name</label>
                    <input name="preferredName" className="input-field" value={form.preferredName} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth *</label>
                    <input name="dob" type="date" required className="input-field" value={form.dob} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Primary Language</label>
                    <input name="primaryLanguage" className="input-field" placeholder="e.g. English, Spanish" value={form.primaryLanguage} onChange={handleInputChange} />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">External/EHR ID</label>
                    <input name="externalEhrId" className="input-field" placeholder="ID from other systems" value={form.externalEhrId} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input name="phone" type="tel" className="input-field" value={form.phone} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input name="email" type="email" className="input-field" value={form.email} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Contact Method</label>
                    <select name="preferredContactMethod" className="input-field" value={form.preferredContactMethod} onChange={handleInputChange}>
                      <option value="">Select...</option>
                      <option value="phone">Phone Call</option>
                      <option value="text">Text Message</option>
                      <option value="email">Email</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mailing Address</label>
                    <input name="address" className="input-field" value={form.address} onChange={handleInputChange} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                      <input name="city" className="input-field" value={form.city} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">County</label>
                      <input name="county" className="input-field" value={form.county} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">ZIP Code</label>
                      <input name="zipCode" className="input-field" value={form.zipCode} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact Name</label>
                    <input name="emergencyContactName" className="input-field" value={form.emergencyContactName} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact Phone</label>
                    <input name="emergencyContactPhone" type="tel" className="input-field" value={form.emergencyContactPhone} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-100">
                  <button type="button" onClick={handleNext} className="btn-primary flex items-center gap-2">
                    Next: Referral & Legal
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* 2. Referral & Legal */}
            {activeSection === 'referral' && (
              <div className="card space-y-6">
                <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Legal Details</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Global Status</label>
                    <select name="status" className="input-field w-full font-bold" value={form.status} onChange={handleInputChange}>
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="declined">Declined</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                   <div className="flex items-center gap-2">
                    <input name="consentSigned" type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600" checked={form.consentSigned} onChange={handleInputChange} />
                    <label className="text-sm font-medium text-slate-700">Consent Signed</label>
                  </div>
                  {form.consentSigned && (
                    <div className="ml-6">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Consent Date</label>
                      <input name="consentDate" type="date" className="input-field max-w-xs" value={form.consentDate} onChange={handleInputChange} />
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <input name="roiSigned" type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600" checked={form.roiSigned} onChange={handleInputChange} />
                    <label className="text-sm font-medium text-slate-700">Release of Information (ROI) Signed</label>
                  </div>
                  {form.roiSigned && (
                    <div className="ml-6">
                      <label className="block text-sm font-medium text-slate-700 mb-1">ROI Signed Date</label>
                      <input name="roiSignedDate" type="date" className="input-field max-w-xs" value={form.roiSignedDate} onChange={handleInputChange} />
                      {form.roiExpirationDate && (
                        <p className="mt-1 text-sm italic text-slate-500">
                          ROI expires on {form.roiExpirationDate}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Staff Person Assigned</label>
                    <input name="staffAssigned" className="input-field" value={form.staffAssigned} onChange={handleInputChange} />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Case Manager/Navigator Assigned</label>
                    <input name="caseManagerAssigned" className="input-field" value={form.caseManagerAssigned} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t border-slate-100">
                  <button type="button" onClick={handlePrevious} className="btn-secondary flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                    Previous: Identity & Contact
                  </button>
                  <button type="button" onClick={handleNext} className="btn-primary flex items-center gap-2">
                    Next: Demographics
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* 3. Demographics */}
            {activeSection === 'demographics' && (
              <div className="card space-y-6">
                <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Demographics</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                    <input
                      name="gender"
                      type="text"
                      className="input-field"
                      placeholder="Enter gender"
                      value={form.gender}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Race</label>
                    <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
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
                          <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">{r}</span>
                        </label>
                      ))}
                    </div>
                    {form.race.includes('Other') && (
                      <input
                        name="raceOther"
                        type="text"
                        className="input-field mt-2"
                        placeholder="Please specify race"
                        value={form.raceOther}
                        onChange={handleInputChange}
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Ethnicity</label>
                    <div className="flex flex-col gap-2 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="ethnicity" 
                          value="Hispanic/Latino" 
                          checked={form.ethnicity === 'Hispanic/Latino'} 
                          onChange={handleInputChange}
                          className="h-4 w-4 border-slate-300 text-blue-600"
                        />
                        <span className="text-sm text-slate-700">Hispanic/Latino</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="ethnicity" 
                          value="Non-Hispanic/Latino" 
                          checked={form.ethnicity === 'Non-Hispanic/Latino'} 
                          onChange={handleInputChange}
                          className="h-4 w-4 border-slate-300 text-blue-600"
                        />
                        <span className="text-sm text-slate-700">Non-Hispanic/Latino</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Veteran Status</label>
                    <select name="veteranStatus" className="input-field" value={form.veteranStatus} onChange={handleInputChange}>
                      <option value="">Select...</option>
                      <option value="Non-Veteran">Non-Veteran</option>
                      <option value="Active Duty">Active Duty</option>
                      <option value="Veteran - Honorable Discharge">Veteran - Honorable Discharge</option>
                      <option value="Veteran - General Under Honorable Conditions">Veteran - General Under Honorable Conditions</option>
                      <option value="Veteran - Other Than Honorable (OTH)">Veteran - Other Than Honorable (OTH)</option>
                      <option value="Veteran - Bad Conduct or Dishonorable">Veteran - Bad Conduct or Dishonorable</option>
                      <option value="National Guard / Reserves (Never Activated)">National Guard / Reserves (Never Activated)</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Disability Status</label>
                    <select name="disabilityStatus" className="input-field" value={form.disabilityStatus} onChange={handleInputChange}>
                      <option value="">Select...</option>
                      <option value="No Disability">No Disability</option>
                      <option value="Physical / Mobility Disability">Physical / Mobility Disability</option>
                      <option value="Mental Health / Psychiatric Disability">Mental Health / Psychiatric Disability</option>
                      <option value="Intellectual / Developmental Disability">Intellectual / Developmental Disability</option>
                      <option value="Visual / Hearing Impairment">Visual / Hearing Impairment</option>
                      <option value="Chronic Health Condition (e.g., HIV/AIDS, Diabetes)">Chronic Health Condition (e.g., HIV/AIDS, Diabetes)</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Citizenship/Work Authorization</label>
                    <select name="citizenshipStatus" className="input-field" value={form.citizenshipStatus} onChange={handleInputChange}>
                      <option value="">Select...</option>
                      <option value="U.S. Citizen">U.S. Citizen</option>
                      <option value="Permanent Resident">Permanent Resident</option>
                      <option value="Work Authorization Document (EAD)">Work Authorization Document (EAD)</option>
                      <option value="Refugee / Asylee">Refugee / Asylee</option>
                      <option value="Other (Non-immigrant visa with work auth)">Other (Non-immigrant visa with work auth)</option>
                      <option value="Does not currently have work authorization">Does not currently have work authorization</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Household Size</label>
                    <input name="householdSize" type="number" min="1" className="input-field" value={form.householdSize} onChange={handleInputChange} />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Number of Dependents</label>
                    <input name="dependentsCount" type="number" min="0" className="input-field" value={form.dependentsCount} onChange={handleInputChange} />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Parenting Status</label>
                    <select name="parentingStatus" className="input-field" value={form.parentingStatus} onChange={handleInputChange}>
                      <option value="">Select...</option>
                      <option value="Not a Parent/Guardian">Not a Parent/Guardian</option>
                      <option value="Single Parent/Guardian">Single Parent/Guardian</option>
                      <option value="Co-parenting">Co-parenting</option>
                      <option value="Expectant Parent">Expectant Parent</option>
                      <option value="Non-custodial Parent">Non-custodial Parent</option>
                      <option value="Foster Parent">Foster Parent</option>
                      <option value="Grandparent/Relative Caregiver">Grandparent/Relative Caregiver</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Marital Status</label>
                    <select name="maritalStatus" className="input-field" value={form.maritalStatus} onChange={handleInputChange}>
                      <option value="">Select...</option>
                      <option value="Single (Never Married)">Single (Never Married)</option>
                      <option value="Married (Legally recognized or Common Law)">Married (Legally recognized or Common Law)</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Separated">Separated</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Domestic Partnership / Civil Union">Domestic Partnership / Civil Union</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t border-slate-100">
                  <button type="button" onClick={handlePrevious} className="btn-secondary flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                    Previous: Referral & Legal
                  </button>
                  <button type="button" onClick={handleNext} className="btn-primary flex items-center gap-2">
                    Next: Socioeconomic Status
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* 4. Socioeconomic Status */}
            {activeSection === 'socioeconomic' && (
              <div className="card space-y-6">
                <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Socioeconomic Status</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Housing Status at Intake</label>
                    <select name="housingStatusAtIntake" className="input-field" value={form.housingStatusAtIntake} onChange={handleInputChange}>
                      <option value="">Select...</option>
                      <option value="Permanent Housing (Owned or Rented)">Permanent Housing (Owned or Rented)</option>
                      <option value="Staying with Friends/Family">Staying with Friends/Family</option>
                      <option value="Emergency Shelter">Emergency Shelter</option>
                      <option value="Transitional Housing / Halfway House">Transitional Housing / Halfway House</option>
                      <option value="Hotel / Motel">Hotel / Motel</option>
                      <option value="Unsheltered (Living in car, street, or encampment)">Unsheltered (Living in car, street, or encampment)</option>
                      <option value="At Risk of Eviction">At Risk of Eviction</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Residence Type</label>
                    <select name="residenceType" className="input-field max-w-xs" value={form.residenceType} onChange={handleInputChange}>
                      <option value="">Select...</option>
                      <option value="rural">Rural</option>
                      <option value="suburban">Suburban</option>
                      <option value="urban">Urban</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Transportation Access</label>
                      <select name="transportationAccess" className="input-field" value={form.transportationAccess} onChange={handleInputChange}>
                        <option value="">Select...</option>
                        <option value="Personal Vehicle (Auto/Motorcycle)">Personal Vehicle (Auto/Motorcycle)</option>
                        <option value="Public Transit">Public Transit</option>
                        <option value="Rideshare (Uber/Lyft/Carpool)">Rideshare (Uber/Lyft/Carpool)</option>
                        <option value="Active Transport (Bicycle/Walking)">Active Transport (Bicycle/Walking)</option>
                        <option value="No Reliable Transportation">No Reliable Transportation</option>
                      </select>
                    </div>
                    <div className="flex items-end pb-2">
                       <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="needsDriversLicense" 
                          checked={form.needsDriversLicense} 
                          onChange={handleInputChange}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                        />
                        <span className="text-sm font-medium text-slate-700">Valid Driver's License?</span>
                      </label>
                    </div>
                  </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Internet Access</label>
                      <select name="internetAccess" className="input-field" value={form.internetAccess} onChange={handleInputChange}>
                        <option value="">Select...</option>
                        <option value="Reliable Home High-Speed">Reliable Home High-Speed</option>
                        <option value="Mobile Data Only (Cell phone hotspot)">Mobile Data Only (Cell phone hotspot)</option>
                        <option value="Public Access Only (Library, cafe, nonprofit office)">Public Access Only (Library, cafe, nonprofit office)</option>
                        <option value="No Access">No Access</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Device Access</label>
                      <select name="deviceAccess" className="input-field" value={form.deviceAccess} onChange={handleInputChange}>
                        <option value="">Select...</option>
                        <option value="Personal Laptop / Desktop">Personal Laptop / Desktop</option>
                        <option value="Personal Tablet">Personal Tablet</option>
                        <option value="Smartphone Only">Smartphone Only</option>
                        <option value="No Personal Device">No Personal Device</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t border-slate-100">
                  <button type="button" onClick={handlePrevious} className="btn-secondary flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                    Previous: Demographics
                  </button>
                  <button
                    form="participant-form"
                    type="submit"
                    className="btn-primary"
                    disabled={createParticipant.isPending}
                  >
                    {createParticipant.isPending ? 'Creating...' : 'Finalize & Create Participant'}
                  </button>
                </div>
              </div>
            )}

            {createParticipant.isError && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 flex items-start gap-3">
                <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <div>
                  <p className="font-bold">Failed to create participant</p>
                  <p className="mt-1">Please check the form for errors and try again.</p>
                </div>
              </div>
            )}
          </form>
        </main>
      </div>
    </div>
  );
}
