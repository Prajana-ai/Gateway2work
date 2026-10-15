/**
 * TSRG Assessment Form Templates
 *
 * Three standardized assessment tools used by the TSRG Workforce Development
 * program to evaluate participants exiting treatment/incarceration for employment
 * readiness. Each template contains a JSON Schema (draft-07) for validation
 * and a UI Schema with layout hints for the frontend renderer.
 */

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const ratingScale1to5 = {
  type: 'integer' as const,
  minimum: 1,
  maximum: 5,
  default: 1,
};

const yesNo = {
  type: 'boolean' as const,
};

// ---------------------------------------------------------------------------
// Assessment 1 - Current Work Profile
// ---------------------------------------------------------------------------

const skillsJsonSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Current Work Profile',
  description:
    'Where the person stands today on day one of their journey. Evaluates vocational and practical skills, work history, education, and transportation access.',

  type: 'object' as const,
  properties: {
    employment_status: {
      type: 'object' as const,
      title: 'Your Current Work Picture',
      description: 'Help us understand your day-to-day schedule right now so we can look for the right matches.',
      properties: {
        employment_status_at_intake: {
          type: 'string' as const,
          title: 'Where do things stand with work today?',
          enum: ['unemployed', 'employed_ft', 'employed_pt', 'not_in_labor_force'],
          enumNames: [
            'Seeking a New Path',
            'Working Full-Time',
            'Working Part-Time',
            'Taking a Break from the Workforce',
          ],
        },
        employment_type_ft_pt: {
          type: 'string' as const,
          title: 'Employed full time or part time',
          enum: ['ft', 'pt', 'na'],
          enumNames: ['Full-Time', 'Part-Time', 'N/A'],
        },
        unemployed_duration_months: {
          type: 'number' as const,
          title: 'Unemployed duration (months)',
          minimum: 0,
        },
        current_employer: {
          type: 'string' as const,
          title: 'Where are you currently working?',
          maxLength: 200,
        },
        job_title: {
          type: 'string' as const,
          title: 'What is your current role?',
          maxLength: 200,
        },
        hours_per_week: {
          type: 'number' as const,
          title: 'About how many hours do you work each week?',
          minimum: 0,
          maximum: 168,
        },
        hourly_wage: {
          type: 'number' as const,
          title: 'What is your current hourly wage?',
          minimum: 0,
          maximum: 500,
        },
        monthly_income_total: {
          type: 'number' as const,
          title: 'What is your current monthly wage?',
          minimum: 0,
          maximum: 25000,
        },
        job_retention_risk: {
          type: 'string' as const,
          title: 'Do you feel your current job is at risk, or are you hoping to transition soon?',
          enum: ['risk_transition', 'stable_open', 'no_risk_exploring'],
          enumNames: [
            'Yes, looking to transition soon',
            "My job feels stable, but I'm open to options",
            'No risk, just exploring',
          ],
        },
        public_benefits_at_intake: {
          ...yesNo,
          title: 'Are you currently receiving any community or public benefits?',
        },
        public_benefits_detail: {
          type: 'array' as const,
          title: 'Which programs are you currently connected with?',
          items: {
            type: 'string' as const,
            enum: [
              'snap',
              'medicaid',
              'tanf',
              'housing_support',
              'ssi_ssdi',
              'childcare_subsidy',
              'other',
            ],
            enumNames: [
              'SNAP / Food Assistance (Food stamps, EBT)',
              'Medicaid / Healthcare Assistance (State medical insurance)',
              'TANF / Cash Assistance (Family support programs)',
              'Housing Support (Section 8, housing vouchers, or rental assistance)',
              'SSI / SSDI (Disability or social security benefits)',
              'Childcare Subsidy (Help paying for daycare)',
              'Other Program',
            ],
          },
          uniqueItems: true,
        },
        public_benefits_other_detail: {
          type: 'string' as const,
          title: 'Other Program Name',
          maxLength: 200,
        },
      },
      required: ['employment_status_at_intake'],
    },
    work_history: {
      type: 'object' as const,
      title: 'Your Work History',
      description: "Every past job taught you something valuable. Let's look at your background.",
      properties: {
        previous_employment: {
          ...yesNo,
          title: 'Have you had a job in the past?',
        },
        years_experience: {
          type: 'number' as const,
          title: 'Roughly how many total years of work experience do you have?',
          minimum: 0,
          maximum: 50,
        },
        last_job_title: {
          type: 'string' as const,
          title: 'What was your most recent job title?',
          maxLength: 200,
        },
        reason_left: {
          type: 'string' as const,
          title: 'What led to you leaving your last role?',
          enum: [
            'laid_off',
            'better_pay_growth',
            'health_personal',
            'career_change',
            'other',
          ],
          enumNames: [
            'Laid off or company closed',
            'Seeking better pay/growth',
            'Health or personal reasons',
            'Career change',
            'Other',
          ],
        },
        primary_work_sector: {
          type: 'string' as const,
          title: 'What industry did you work in most?',
          maxLength: 200,
        },
        resume_available: {
          ...yesNo,
          title: 'Do you have a resume ready to share?',
        },
        resume_completion_date: {
          type: 'string' as const,
          format: 'date' as const,
          title: 'Resume completion Date',
        },
        resume_freshness: {
          type: 'string' as const,
          title: 'How up-to-date is your resume?',
          enum: [
            'current_ready',
            'mostly_ready_quick_review',
            'older_missing_experience',
          ],
          enumNames: [
            'It is current and ready to send to employers',
            'It is mostly ready, but needs a quick review or update',
            'It is older and missing my most recent experience',
          ],
        },
      },
      required: ['previous_employment'],
    },
    technical_skills: {
      type: 'object' as const,
      title: 'Technical Skills',
      description:
        'Rate proficiency in each vocational skill area (1 = None, 2 = Basic, 3 = Intermediate, 4 = Advanced, 5 = Expert).',
      properties: {
        food_service: {
          ...ratingScale1to5,
          title: 'Food Service',
        },
        construction: {
          ...ratingScale1to5,
          title: 'Construction',
        },
        warehouse: {
          ...ratingScale1to5,
          title: 'Warehouse / Logistics',
        },
        retail: {
          ...ratingScale1to5,
          title: 'Retail',
        },
        automotive: {
          ...ratingScale1to5,
          title: 'Automotive',
        },
        manufacturing: {
          ...ratingScale1to5,
          title: 'Manufacturing',
        },
        landscaping: {
          ...ratingScale1to5,
          title: 'Landscaping / Groundskeeping',
        },
        cleaning: {
          ...ratingScale1to5,
          title: 'Cleaning / Janitorial',
        },
        office_admin: {
          ...ratingScale1to5,
          title: 'Office Administration',
        },
        healthcare_support: {
          ...ratingScale1to5,
          title: 'Healthcare Support',
        },
        other: {
          ...ratingScale1to5,
          title: 'Other',
        },
      },
      required: [
        'food_service',
        'construction',
        'warehouse',
        'retail',
        'automotive',
        'manufacturing',
        'landscaping',
        'cleaning',
        'office_admin',
        'healthcare_support',
      ],
    },
    soft_skills: {
      type: 'object' as const,
      title: 'Soft Skills',
      description:
        'Rate each interpersonal / workplace skill (1 = Very Low, 2 = Low, 3 = Average, 4 = Good, 5 = Excellent).',
      properties: {
        communication: { ...ratingScale1to5, title: 'Communication' },
        teamwork: { ...ratingScale1to5, title: 'Teamwork' },
        time_management: { ...ratingScale1to5, title: 'Time Management' },
        problem_solving: { ...ratingScale1to5, title: 'Problem Solving' },
        reliability: { ...ratingScale1to5, title: 'Reliability' },
        adaptability: { ...ratingScale1to5, title: 'Adaptability' },
      },
      required: [
        'communication',
        'teamwork',
        'time_management',
        'problem_solving',
        'reliability',
        'adaptability',
      ],
    },
    education: {
      type: 'object' as const,
      title: 'Your Learning Foundation',
      description: 'Education comes in many forms. Tell us about your background and where you feel most confident.',
      properties: {
        highest_degree_earned: {
          type: 'string' as const,
          title: 'What is the highest school grade or degree you completed?',
          enum: [
            'high_school_ged',
            'trade_cert',
            'some_college',
            'college_degree',
            'none',
          ],
          enumNames: [
            'High School Diploma or GED',
            'Trade School / Vocational Certificate',
            'Some College',
            "College Degree (Associate, Bachelor's, or higher)",
            'Did not complete High School',
          ],
        },
        highest_grade_completed: {
          type: 'string' as const,
          title: 'What was the last grade you completed?',
          enum: ['9th_grade', '10th_grade', '11th_grade', '8th_grade_below'],
          enumNames: ['9th Grade', '10th Grade', '11th Grade', '8th Grade or below'],
        },
        ged_status: {
          type: 'string' as const,
          title: 'Where do things stand with your GED?',
          enum: [
            'want_to_start',
            'taking_classes',
            'passed_some_tests',
            'focused_on_work',
          ],
          enumNames: [
            'I want to start working toward my GED',
            'I am currently taking GED classes',
            'I have passed some of the tests already',
            'I am focused on finding work right now',
          ],
        },
        certifications: {
          type: 'string' as const,
          title: 'Do you hold any professional certifications, licenses, or trade credentials?',
          description: 'Examples: ServSafe, OSHA, Forklift, CNA, CPR, Cosmetology, etc. Leave blank if none.',
          maxLength: 500,
        },
        currently_enrolled: {
          ...yesNo,
          title: 'Are you currently taking any classes, training courses, or school programs?',
        },
        current_training_details: {
          type: 'string' as const,
          title: 'Name of training or program',
          maxLength: 200,
        },
        reading_proficiency: {
          type: 'string' as const,
          title: 'Reading & Writing',
          enum: ['very_comfortable', 'comfortable', 'brush_up'],
          enumNames: ['Very Comfortable', 'Comfortable', 'Need a quick brush-up'],
        },
        math_proficiency: {
          type: 'string' as const,
          title: 'Everyday Math',
          enum: ['very_comfortable', 'comfortable', 'brush_up'],
          enumNames: ['Very Comfortable', 'Comfortable', 'Need a quick brush-up'],
        },
        english_proficiency: {
          type: 'string' as const,
          title: 'Conversational English',
          enum: ['very_comfortable', 'comfortable', 'brush_up'],
          enumNames: ['Very Comfortable', 'Comfortable', 'Need a quick brush-up'],
        },
        digital_proficiency: {
          type: 'string' as const,
          title: 'Using Computers/Smartphones for Work',
          enum: ['very_comfortable', 'comfortable', 'brush_up'],
          enumNames: ['Very Comfortable', 'Comfortable', 'Need a quick brush-up'],
        },
      },
      required: ['highest_degree_earned', 'currently_enrolled'],
    },
    transportation: {
      type: 'object' as const,
      title: 'Commuting & Getting to Work',
      description: "Let's make sure your new job is easy and safe to get to every day.",
      properties: {
        reliable_options: {
          type: 'array' as const,
          title: 'What are your reliable options for getting to work? (Select all that apply)',
          items: {
            type: 'string' as const,
            enum: [
              'valid_drivers_license',
              'has_vehicle',
              'public_transit',
              'walk_bike_rideshare',
            ],
            enumNames: [
              "I have a valid driver's license",
              'I have my own vehicle',
              'I use public transit (bus, train, subway)',
              'I walk, bike, or ride-share',
            ],
          },
          uniqueItems: true,
        },
        willing_to_commute_miles: {
          type: 'string' as const,
          title: 'How far are you comfortably willing to travel for the right job?',
          enum: [
            'under_5',
            '5_to_10',
            '10_to_20',
            '20_plus',
            'remote_only',
          ],
          enumNames: [
            'Under 5 miles',
            '5 to 10 miles',
            '10 to 20 miles',
            '20+ miles',
            'I am looking for Remote work only',
          ],
        },
      },
      required: ['willing_to_commute_miles'],
    },
  },
  required: [
    'employment_status',
    'work_history',
    'education',
    'transportation',
  ],
};

const skillsUiSchema = {
  'ui:order': [
    'employment_status',
    'work_history',
    'education',
    'transportation',
  ],
  employment_status: {
    'ui:title': 'Your Current Work Picture',
    'ui:description':
      'Help us understand your day-to-day schedule right now so we can look for the right matches.',
    'ui:order': [
      'employment_status_at_intake',
      'unemployed_duration_months',
      'current_employer',
      'job_title',
      'hours_per_week',
      'hourly_wage',
      'monthly_income_total',
      'job_retention_risk',
      'public_benefits_at_intake',
      'public_benefits_detail',
      'public_benefits_other_detail',
    ],
    employment_status_at_intake: {
      'ui:widget': 'radio',
    },
    unemployed_duration_months: { 'ui:widget': 'number' },
    current_employer: { 'ui:widget': 'text' },
    job_title: { 'ui:widget': 'text' },
    hourly_wage: { 'ui:widget': 'number' },
    hours_per_week: { 'ui:widget': 'number' },
    monthly_income_total: { 'ui:widget': 'number' },
    job_retention_risk: { 'ui:widget': 'radio' },
    public_benefits_at_intake: { 'ui:widget': 'radio' },
    public_benefits_detail: { 'ui:widget': 'checkboxes' },
    public_benefits_other_detail: { 'ui:widget': 'text' },
  },
  work_history: {
    'ui:title': 'Your Work History',
    'ui:description': "Every past job taught you something valuable. Let's look at your background.",
    'ui:order': [
      'previous_employment',
      'years_experience',
      'last_job_title',
      'reason_left',
      'primary_work_sector',
      'resume_available',
      'resume_completion_date',
      'resume_freshness',
    ],
    previous_employment: { 'ui:widget': 'radio' },
    years_experience: { 'ui:widget': 'number' },
    last_job_title: { 'ui:widget': 'text' },
    reason_left: { 'ui:widget': 'radio' },
    primary_work_sector: { 'ui:widget': 'text' },
    resume_available: { 'ui:widget': 'radio' },
    resume_completion_date: { 'ui:widget': 'date' },
    resume_freshness: { 'ui:widget': 'radio' },
  },
  education: {
    'ui:title': 'Your Learning Foundation',
    'ui:description':
      'Education comes in many forms. Tell us about your background and where you feel most confident.',
    'ui:order': [
      'highest_degree_earned',
      'highest_grade_completed',
      'ged_status',
      'certifications',
      'currently_enrolled',
      'current_training_details',
      'reading_proficiency',
      'math_proficiency',
      'english_proficiency',
      'digital_proficiency',
    ],
    highest_degree_earned: { 'ui:widget': 'radio' },
    highest_grade_completed: { 'ui:widget': 'radio' },
    ged_status: { 'ui:widget': 'radio' },
    certifications: { 'ui:widget': 'text' },
    currently_enrolled: { 'ui:widget': 'radio' },
    current_training_details: { 'ui:widget': 'text' },
    reading_proficiency: { 'ui:widget': 'radio' },
    math_proficiency: { 'ui:widget': 'radio' },
    english_proficiency: { 'ui:widget': 'radio' },
    digital_proficiency: { 'ui:widget': 'radio' },
  },
  transportation: {
    'ui:title': 'Commuting & Getting to Work',
    'ui:description':
      "Let's make sure your new job is easy and safe to get to every day.",
    'ui:order': [
      'reliable_options',
      'willing_to_commute_miles',
    ],
    reliable_options: { 'ui:widget': 'checkboxes' },
    willing_to_commute_miles: { 'ui:widget': 'radio' },
  },
};

// ---------------------------------------------------------------------------
// Assessment 2 - Workstyle Strengths (RIASEC / Holland Code)
// ---------------------------------------------------------------------------

const interestsJsonSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Workstyle Strengths',
  description:
    'Their natural professional personality, drivers, and vocational assets. Holland Code (RIASEC) style interest assessment to identify career interest areas and work preferences.',

  type: 'object' as const,
  properties: {
    discover_work_style: {
      type: 'object' as const,
      title: 'Discover Your Work Style',
      description:
        "What kinds of activities do you genuinely enjoy? Tap everything that sounds fun to you—don't worry about whether you have the skills yet!",
      properties: {
        realistic: {
          type: 'array' as const,
          title: '🛠️ Working with Your Hands (Realistic)',
          items: {
            type: 'string' as const,
            enum: [
              'building_things',
              'working_outdoors',
              'operating_machinery',
              'fixing_repairing',
              'working_with_tools',
            ],
            enumNames: [
              'Building things',
              'Working outdoors',
              'Operating machinery',
              'Fixing or repairing things',
              'Working with tools',
            ],
          },
          uniqueItems: true,
        },
        investigative: {
          type: 'array' as const,
          title: '🔍 Solving Problems (Investigative)',
          items: {
            type: 'string' as const,
            enum: [
              'researching_topics',
              'troubleshooting_tech',
              'analyzing_data',
              'figuring_how_things_work',
              'solving_complex_puzzles',
            ],
            enumNames: [
              'Researching new topics',
              'Troubleshooting or fixing tech problems',
              'Analyzing data or patterns',
              'Figuring out how things work',
              'Solving complex puzzles',
            ],
          },
          uniqueItems: true,
        },
        artistic: {
          type: 'array' as const,
          title: '🎨 Being Creative (Artistic)',
          items: {
            type: 'string' as const,
            enum: [
              'designing_sketching',
              'creative_writing',
              'decorating_spaces',
              'crafting_visual_art',
              'music_performance',
            ],
            enumNames: [
              'Designing or sketching things',
              'Creative writing or storytelling',
              'Decorating or arranging spaces',
              'Crafting or making visual art',
              'Music, performance, or entertainment',
            ],
          },
          uniqueItems: true,
        },
        social: {
          type: 'array' as const,
          title: '🤝 Helping People (Social)',
          items: {
            type: 'string' as const,
            enum: [
              'teaching_training',
              'listening_counseling',
              'volunteering_community',
              'mentoring_guiding',
              'supporting_people',
            ],
            enumNames: [
              'Teaching, training, or coaching',
              'Listening, counseling, or advising',
              'Volunteering and community work',
              'Mentoring or guiding someone',
              'Supporting people who need help',
            ],
          },
          uniqueItems: true,
        },
        enterprising: {
          type: 'array' as const,
          title: '🚀 Leading & Managing (Enterprising)',
          items: {
            type: 'string' as const,
            enum: [
              'leading_groups',
              'pitching_ideas',
              'starting_projects',
              'organizing_people',
              'speaking_in_front',
            ],
            enumNames: [
              'Leading groups or teams',
              'Pitching ideas, selling, or persuading',
              'Starting up new projects',
              'Organizing and managing people',
              'Speaking in front of groups',
            ],
          },
          uniqueItems: true,
        },
        conventional: {
          type: 'array' as const,
          title: '📋 Organizing & Details (Conventional)',
          items: {
            type: 'string' as const,
            enum: [
              'organizing_files',
              'following_process',
              'managing_data_entry',
              'scheduling_events',
              'working_numbers_budgets',
            ],
            enumNames: [
              'Organizing files or information',
              'Following a clear, step-by-step process',
              'Managing data entry or records',
              'Scheduling and planning events',
              'Working with numbers or budgets',
            ],
          },
          uniqueItems: true,
        },
      },
    },
    preferences: {
      type: 'object' as const,
      title: 'Your Work Choices',
      description:
        'Help us understand your day-to-day needs so we can match you with jobs that respect your schedule and lifestyle.',
      properties: {
        preferred_work_environment: {
          type: 'string' as const,
          title: 'Preferred Work Environment',
          description: 'Where do you feel most comfortable working? (Select one)',
          enum: ['indoor', 'outdoor', 'both'],
          enumNames: ['Indoor', 'Outdoor', 'Both Indoor and Outdoor'],
        },
        work_location_style: {
          type: 'string' as const,
          title: 'Work Location Style',
          description: 'What type of setup works best for your daily life? (Select one)',
          enum: ['in_person', 'remote', 'hybrid'],
          enumNames: ['In-Person / On-Site', 'Remote / Work from Home', 'Hybrid / Mix'],
        },
        preferred_workplace_setting: {
          type: 'array' as const,
          title: 'Preferred Workplace Setting',
          description: 'What kind of organization or workplace vibe appeals to you? (Select all that apply)',
          items: {
            type: 'string' as const,
            enum: [
              'corporate_office',
              'hands_on_field',
              'community_customer_facing',
              'casual_creative',
            ],
            enumNames: [
              'Corporate / Office',
              'Hands-On / Field Work',
              'Community & Customer Facing',
              'Casual / Creative',
            ],
          },
          uniqueItems: true,
        },
        preferred_schedule: {
          type: 'string' as const,
          title: 'Preferred Work Schedule',
          description: 'What type of hours fit your life right now? (Select one)',
          enum: ['full_time', 'part_time', 'flexible'],
          enumNames: ['Full-Time', 'Part-Time', 'Flexible Schedule'],
        },
      },
      required: [
        'preferred_work_environment',
        'work_location_style',
        'preferred_schedule',
      ],
    },
    future_goals: {
      type: 'object' as const,
      title: 'Your Future Goals',
      description:
        "Let's talk about your targets so we can match you with positions that pay fairly and respect your timeline.",
      properties: {
        target_hourly_wage: {
          type: 'string' as const,
          title: 'What is your target hourly wage starting out?',
          description: 'Example: $18/hour',
        },
        short_term_goal: {
          type: 'string' as const,
          title: 'What is your immediate, short-term goal? (Select one)',
          enum: [
            'land_steady_job_30_days',
            'complete_training_cert_first',
            'find_flexible_role_balance',
          ],
          enumNames: [
            'Land a steady job within the next 30 days',
            'Complete a training or certification program first',
            'Find a flexible role to balance my schedule',
          ],
        },
        long_term_goal: {
          type: 'string' as const,
          title: 'Where do you see yourself in the long-term? (Select one)',
          enum: [
            'advancing_leadership',
            'staying_stable_reliable',
            'launching_own_business',
          ],
          enumNames: [
            'Advancing into management or leadership',
            'Staying stable and secure in a reliable field',
            'Launching my own business or trade shop',
          ],
        },
        career_goals: {
          type: 'string' as const,
          title: 'Tell us about your ultimate career path or dream job:',
        },
      },
    },
    fields_of_choice: {
      type: 'object' as const,
      title: 'Your Fields of Choice',
      description:
        'What fields excite you? Select any areas you have worked in before, or places where you would love to start a new career. (Tap all that apply)',
      properties: {
        fields: {
          type: 'array' as const,
          title: 'Select fields',
          items: {
            type: 'string' as const,
            enum: [
              'automotive',
              'cleaning_janitorial',
              'construction',
              'education',
              'food_service',
              'healthcare_support',
              'landscaping_groundskeeping',
              'manufacturing',
              'office_admin',
              'retail',
              'social_services',
              'technology_digital',
              'warehouse_logistics',
              'other',
            ],
            enumNames: [
              'Automotive',
              'Cleaning / Janitorial / Facilities',
              'Construction / Trades',
              'Education',
              'Food Service',
              'Healthcare Support',
              'Landscaping / Groundskeeping',
              'Manufacturing',
              'Office Administration',
              'Retail',
              'Social Services / Peer Support',
              'Technology & Digital Support',
              'Warehouse / Logistics',
              'Other / Open to anything',
            ],
          },
          uniqueItems: true,
        },
      },
    },
    personal_superpowers: {
      type: 'object' as const,
      title: 'Your Personal Superpowers',
      description:
        'Which of these skills feel like your strongest natural talents? Choose the ones that best describe how you work. (Pick your top 3 to 4 strongest superpowers)',
      properties: {
        skills: {
          type: 'array' as const,
          title: 'Select your superpowers',
          items: {
            type: 'string' as const,
            enum: [
              'adaptable_thinker',
              'clear_communicator',
              'detail_oriented',
              'determined_resilient',
              'eager_learner',
              'great_time_manager',
              'problem_solver',
              'reliable_punctual',
              'team_player',
            ],
            enumNames: [
              'Adaptable Thinker (I handle changes well and love learning new things)',
              'Clear Communicator (I express ideas well and listen closely)',
              'Detail-Oriented (I take pride in doing things accurately and neatly)',
              "Determined & Resilient (I don't give up easily and I learn from challenges)",
              'Eager Learner (I love picking up new skills and taking on training)',
              'Great Time Manager (I show up on time and organize my day well)',
              'Problem Solver (I stay calm and find solutions when things go wrong)',
              'Reliable & Punctual (People can always count on me to follow through)',
              'Team Player (I enjoy working with others to get things done)',
            ],
          },
          uniqueItems: true,
        },
      },
    },
  },
  required: ['discover_work_style'],
};

const interestsUiSchema = {
  'ui:order': [
    'discover_work_style',
    'preferences',
    'future_goals',
    'fields_of_choice',
    'personal_superpowers',
  ],
  discover_work_style: {
    'ui:title': 'Discover Your Work Style',
    'ui:description':
      "What kinds of activities do you genuinely enjoy? Tap everything that sounds fun to you—don't worry about whether you have the skills yet!",
    realistic: { 'ui:widget': 'checkboxes' },
    investigative: { 'ui:widget': 'checkboxes' },
    artistic: { 'ui:widget': 'checkboxes' },
    social: { 'ui:widget': 'checkboxes' },
    enterprising: { 'ui:widget': 'checkboxes' },
    conventional: { 'ui:widget': 'checkboxes' },
  },
  preferences: {
    'ui:title': 'Your Work Choices',
    'ui:description':
      'Help us understand your day-to-day needs so we can match you with jobs that respect your schedule and lifestyle.',
    'ui:order': [
      'preferred_work_environment',
      'work_location_style',
      'preferred_workplace_setting',
      'preferred_schedule',
    ],
    preferred_work_environment: { 'ui:widget': 'radio' },
    work_location_style: { 'ui:widget': 'radio' },
    preferred_workplace_setting: { 'ui:widget': 'checkboxes' },
    preferred_schedule: { 'ui:widget': 'radio' },
  },
  future_goals: {
    'ui:title': 'Your Future Goals',
    'ui:description':
      "Let's talk about your targets so we can match you with positions that pay fairly and respect your timeline.",
    'ui:order': [
      'target_hourly_wage',
      'short_term_goal',
      'long_term_goal',
      'career_goals',
    ],
    short_term_goal: { 'ui:widget': 'radio' },
    long_term_goal: { 'ui:widget': 'radio' },
    career_goals: {
      'ui:widget': 'textarea',
      'ui:options': { rows: 4 },
    },
  },
  fields_of_choice: {
    'ui:title': 'Your Fields of Choice',
    'ui:description':
      'What fields excite you? Select any areas you have worked in before, or places where you would love to start a new career. (Tap all that apply)',
    fields: {
      'ui:widget': 'checkboxes',
      'ui:options': {
        labels: {
          automotive: 'Automotive',
          cleaning_janitorial: 'Cleaning / Janitorial / Facilities',
          construction: 'Construction / Trades',
          education: 'Education',
          food_service: 'Food Service',
          healthcare_support: 'Healthcare Support',
          landscaping_groundskeeping: 'Landscaping / Groundskeeping',
          manufacturing: 'Manufacturing',
          office_admin: 'Office Administration',
          retail: 'Retail',
          social_services: 'Social Services / Peer Support',
          technology_digital: 'Technology & Digital Support',
          warehouse_logistics: 'Warehouse / Logistics',
          other: 'Other / Open to anything',
        },
      },
    },
  },
  personal_superpowers: {
    'ui:title': 'Your Personal Superpowers',
    'ui:description':
      'Which of these skills feel like your strongest natural talents? Choose the ones that best describe how you work. (Pick your top 3 to 4 strongest superpowers)',
    skills: {
      'ui:widget': 'checkboxes',
      'ui:options': {
        labels: {
          adaptable_thinker: 'Adaptable Thinker (I handle changes well and love learning new things)',
          clear_communicator: 'Clear Communicator (I express ideas well and listen closely)',
          detail_oriented: 'Detail-Oriented (I take pride in doing things accurately and neatly)',
          determined_resilient: "Determined & Resilient (I don't give up easily and I learn from challenges)",
          eager_learner: 'Eager Learner (I love picking up new skills and taking on training)',
          great_time_manager: 'Great Time Manager (I show up on time and organize my day well)',
          problem_solver: 'Problem Solver (I stay calm and find solutions when things go wrong)',
          reliable_punctual: 'Reliable & Punctual (People can always count on me to follow through)',
          team_player: 'Team Player (I enjoy working with others to get things done)',
        },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Assessment 3 - Support Needs
// ---------------------------------------------------------------------------

const barriersJsonSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Support Needs',
  description:
    'The specific assistance, tools, or accommodations required to guarantee participant success. Identifies obstacles including housing stability, legal history, health, finances, support systems, childcare, technology access, and identification documents.',

  type: 'object' as const,
  properties: {
    housing: {
      type: 'object' as const,
      title: 'Your Living Space & Area',
      description:
        'Understanding your current living situation helps us find jobs with the right stability and location for you.',
      properties: {
        housing_status_at_intake: {
          type: 'string' as const,
          title: 'What best describes your current housing setup?',
          enum: ['stable', 'temporary', 'shelter', 'transitional', 'seeking_support'],
          enumNames: [
            'Stable Housing',
            'Temporary / Staying with Friends',
            'Staying in a Shelter',
            'Transitional Housing',
            'Seeking Housing Support',
          ],
        },
        housing_stable_months: {
          type: 'string' as const,
          title: 'About how long have you lived at your current address?',
          enum: ['under_6m', '6_to_12m', '1_to_2y', 'over_2y'],
          enumNames: [
            'Less than 6 months',
            '6 to 12 months',
            '1 to 2 years',
            'More than 2 years',
          ],
        },
        residence_type: {
          type: 'string' as const,
          title: 'What type of area do you live in?',
          enum: ['urban', 'suburban', 'rural'],
          enumNames: ['Urban / City', 'Suburban', 'Rural / Country'],
        },
      },
      required: ['housing_status_at_intake'],
    },
    legal: {
      type: 'object' as const,
      title: 'Navigating Background Steps',
      description:
        'Many employers run standard background checks. Knowing your history lets our team advocate for you and look for second-chance employers.',
      properties: {
        background_steps: {
          type: 'array' as const,
          title: 'Are there any background steps we should prepare for together? (Select all that apply)',
          items: {
            type: 'string' as const,
            enum: [
              'past_conviction',
              'probation_parole',
              'pending_charges',
              'registry_requirements',
            ],
            enumNames: [
              'I have a past conviction we need to navigate',
              'I am currently working with a probation or parole officer',
              'I have charges that are currently pending',
              'I have specific registry or formatting requirements we need to plan around',
            ],
          },
          uniqueItems: true,
        },
        legal_notes: {
          type: 'string' as const,
          title:
            'Is there any extra context you would like our team to know so we can best support you?',
          maxLength: 2000,
        },
      },
    },
    health: {
      type: 'object' as const,
      title: 'Health & Daily Energy',
      description:
        'We want to make sure your work environment completely respects your physical and mental well-being.',
      properties: {
        physical_limitations: {
          ...yesNo,
          title: 'Do you need any physical adjustments or accommodations at work?',
        },
        physical_limitations_detail: {
          type: 'string' as const,
          title:
            'Please let us know what setup helps you work safely (e.g., no heavy lifting, sitting options):',
          maxLength: 1000,
        },
        wellness_appointments: {
          type: 'array' as const,
          title:
            'Are there any wellness or recovery appointments we should help schedule your work hours around? (Select all that apply)',
          items: {
            type: 'string' as const,
            enum: [
              'mental_health',
              'medical_treatments',
              'in_recovery',
              'none_open_schedule',
            ],
            enumNames: [
              'Yes, I have mental health or counseling appointments to plan around',
              'Yes, I have healthcare or medical treatments to plan around',
              'Yes, I am proudly in recovery and have milestones to celebrate',
              'No, my schedule is completely open',
            ],
          },
          uniqueItems: true,
        },
        currently_in_treatment: {
          type: 'string' as const,
          title:
            'Are you currently participating in an active recovery or treatment program?',
          enum: ['active_program', 'navigating_independently'],
          enumNames: [
            'Yes, actively in a program',
            'No, navigating my recovery independently',
          ],
        },
        recovery_months: {
          type: 'string' as const,
          title: 'About how long have you been on your recovery journey?',
          enum: ['under_6m', '6_to_12m', '1_to_2y', 'over_2y'],
          enumNames: [
            'Less than 6 months',
            '6 to 12 months',
            '1 to 2 years',
            'More than 2 years',
          ],
        },
        medications_affecting_work: {
          type: 'string' as const,
          title:
            'Are you taking any prescribed medications that require a specific workplace setting?',
          enum: ['has_safety_needs', 'no_accommodations_needed'],
          enumNames: [
            'Yes, I have specific medication or safety needs',
            'No medication accommodations needed',
          ],
        },
        medications_detail: {
          type: 'string' as const,
          title:
            'Please share any safety needs our team should look out for (e.g., avoiding heavy machinery, specific break times):',
          maxLength: 1000,
        },
      },
      required: ['physical_limitations', 'medications_affecting_work'],
    },
    financial: {
      type: 'object' as const,
      title: 'Getting Paid & Everyday Tools',
      description:
        "Let's make sure you have everything ready to receive your hard-earned paychecks and manage your resources.",
      properties: {
        current_income_source: {
          type: 'string' as const,
          title: 'What is your primary source of income right now?',
          enum: ['none', 'part_time', 'benefits', 'disability', 'family'],
          enumNames: [
            'No current income',
            'Part-time work',
            'Government / Public benefits',
            'Disability benefits',
            'Family or community support',
          ],
        },
        has_bank_account: {
          type: 'string' as const,
          title: 'Do you currently have a safe way to receive direct deposit?',
          enum: ['active_account', 'need_help_setting_up'],
          enumNames: [
            'Yes, I have an active bank account',
            'No, I need help setting up an account',
          ],
        },
        financial_goals: {
          type: 'array' as const,
          title:
            'Are there any personal financial goals or obligations we can help you navigate? (Select all that apply)',
          items: {
            type: 'string' as const,
            enum: [
              'child_support_help',
              'budgeting_planning_help',
              'no_extra_help_needed',
            ],
            enumNames: [
              'Help navigating child support systems',
              'Help with budgeting and financial planning',
              'No extra help needed here',
            ],
          },
          uniqueItems: true,
        },
        budgeting_debt_focus: {
          type: 'string' as const,
          title:
            'To help us tailor your budgeting support, would you like help navigating outstanding debt or credit building?',
          enum: ['managing_debt', 'credit_and_saving', 'basic_budget_only'],
          enumNames: [
            'Yes, I would love help managing or reducing debt',
            'Yes, I want to focus on credit building and saving',
            'No, I just want to focus on a basic everyday budget',
          ],
        },
      },
      required: ['current_income_source', 'has_bank_account'],
    },
    support_system: {
      type: 'object' as const,
      title: 'Your Team & Support Network',
      description:
        "You don’t have to do this alone. Let’s look at who is already in your corner.",
      properties: {
        support_circle: {
          type: 'array' as const,
          title:
            'Who is currently part of your personal or professional support circle? (Select all that apply)',
          items: {
            type: 'string' as const,
            enum: [
              'family_friends',
              'sponsor_mentor',
              'case_manager',
              'looking_to_build',
            ],
            enumNames: [
              'I have an encouraging circle of family or friends',
              'I have a professional sponsor, mentor, or counselor',
              'I have an assigned community case manager',
              'I am currently looking to build up my support network',
            ],
          },
          uniqueItems: true,
        },
        has_sponsor_mentor: {
          ...yesNo,
          title: 'Has a sponsor or mentor?',
        },
        case_manager_assigned: {
          ...yesNo,
          title: 'Has an assigned case manager?',
        },
      },
    },
    childcare: {
      type: 'object' as const,
      title: 'Family & Caregiving',
      description:
        'If you take care of loved ones, we want to build a career plan that respects your family schedule.',
      properties: {
        has_dependents: {
          ...yesNo,
          title:
            'Do you have dependent children or family members who rely on your care?',
        },
        number_of_dependents: {
          type: 'integer' as const,
          title: 'How many loved ones do you care for?',
          minimum: 0,
          maximum: 20,
        },
        childcare_arranged: {
          type: 'string' as const,
          title:
            'Where do things stand with your daily caregiving arrangements?',
          enum: [
            'completely_set_up',
            'need_backup_options',
            'need_help_finding',
          ],
          enumNames: [
            'I have reliable childcare/caregiving completely set up',
            'My caregiving is set up, but I need backup options',
            'I need help finding or paying for reliable childcare',
          ],
        },
      },
      required: ['has_dependents'],
    },
    technology: {
      type: 'object' as const,
      title: 'Digital Connections',
      description:
        "Let's ensure you can easily check your schedule, talk to employers, and stay connected.",
      properties: {
        tech_tools: {
          type: 'array' as const,
          title:
            'What everyday tech tools do you have reliable access to? (Select all that apply)',
          items: {
            type: 'string' as const,
            enum: ['smartphone', 'email', 'home_internet'],
            enumNames: [
              'I have a smartphone with a working phone number',
              'I have an active email address I can check easily',
              'I have a reliable internet or data connection at home',
            ],
          },
          uniqueItems: true,
        },
        has_smartphone: {
          ...yesNo,
          title: 'Has a smartphone?',
        },
        has_email: {
          ...yesNo,
          title: 'Has an active email address?',
        },
        internet_access_type: {
          ...yesNo,
          title: 'Has reliable internet access?',
        },
      },
    },
    identification: {
      type: 'object' as const,
      title: 'Your Launch Toolkit',
      description:
        "To wrap things up, let's look at the physical items you have ready today, and any final areas where our team can stand behind you.",
      properties: {
        physical_items: {
          type: 'array' as const,
          title:
            'I have these physical items ready for my first day of work: (Select all that apply)',
          items: {
            type: 'string' as const,
            enum: ['state_id', 'ssn_card', 'birth_cert', 'clothing'],
            enumNames: [
              "A valid, unexpired State ID or Driver's License",
              'My physical Social Security Card',
              'My official Birth Certificate',
              'Professional work clothing or a uniform layout',
            ],
          },
          uniqueItems: true,
        },
        support_paths: {
          type: 'array' as const,
          title:
            "I would love your program's help unlocking these specific resources or support paths: (Select all that apply)",
          items: {
            type: 'string' as const,
            enum: [
              'id_help',
              'clothing_help',
              'confidence_help',
              'career_help',
              'language_help',
              'discrimination_help',
              'scheduling_help',
              'other_help',
              'ready_submit',
            ],
            enumNames: [
              'Help ordering or replacing my legal IDs or documents',
              'Help getting interview clothes, work boots, or trade apparel',
              'Help polishing my interview skills and building my career confidence',
              'Help landing my very first job or navigating a brand new career field',
              'Help navigating language barriers or workplace communication',
              'Help finding employers who explicitly promote fair hiring and fight workplace discrimination',
              'Help mapping out and balancing my weekly work and personal schedules',
              'Other support',
              'I am ready to submit! No extra resources needed today.',
            ],
          },
          uniqueItems: true,
        },
        other_support_detail: {
          type: 'string' as const,
          title: 'Type what you need here:',
          maxLength: 2000,
        },
        has_state_id: {
          ...yesNo,
          title: 'Has a valid state-issued ID?',
        },
        has_social_security_card: {
          ...yesNo,
          title: 'Has a Social Security card?',
        },
        has_birth_certificate: {
          ...yesNo,
          title: 'Has a birth certificate?',
        },
      },
    },
    vocational: {
      type: 'object' as const,
      title: 'Vocational Barriers',
      description:
        'Specific obstacles related to job seeking and workplace success.',
      properties: {
        specific_barriers: {
          type: 'array' as const,
          title: 'Specific Employment Barriers',
          items: {
            type: 'string' as const,
            enum: [
              'lack_of_transportation',
              'lack_of_childcare',
              'housing_instability',
              'no_work_history',
              'criminal_record',
              'limited_education',
              'limited_digital_skills',
              'limited_interview_skills',
              'limited_resume_skills',
              'lack_of_work_clothing',
              'lack_of_identification',
              'limited_phone_internet',
              'health_related',
              'behavioral_health',
              'substance_use',
              'language_barriers',
              'scheduling_barriers',
              'confidence_motivation',
              'employer_discrimination',
              'other_barrier',
            ],
            enumNames: [
              'Lack of transportation',
              'Lack of childcare',
              'Housing instability',
              'No work history',
              'Criminal record barrier',
              'Limited education',
              'Limited digital skills',
              'Limited interview skills',
              'Limited resume skills',
              'Lack of work clothing',
              'Lack of identification documents',
              'Limited access to phone or internet',
              'Health related barriers',
              'Behavioral health barriers',
              'Substance use related barriers',
              'Language barriers',
              'Scheduling barriers',
              'Confidence or motivation concerns',
              'Employer discrimination reported',
              'Other barrier',
            ],
          },
          uniqueItems: true,
        },
        barrier_notes: {
          type: 'string' as const,
          title: 'Barrier notes',
          maxLength: 2000,
        },
      },
      required: ['specific_barriers'],
    },
  },
  required: [
    'housing',
    'legal',
    'health',
    'financial',
    'support_system',
    'childcare',
    'technology',
    'identification',
    'vocational',
  ],
};

const barriersUiSchema = {
  'ui:order': [
    'housing',
    'legal',
    'health',
    'financial',
    'support_system',
    'childcare',
    'technology',
    'identification',
    'vocational',
  ],
  housing: {
    'ui:title': 'Your Living Space & Area',
    'ui:description':
      'Understanding your current living situation helps us find jobs with the right stability and location for you.',
    'ui:order': [
      'housing_status_at_intake',
      'housing_stable_months',
      'residence_type',
    ],
    housing_status_at_intake: { 'ui:widget': 'radio' },
    housing_stable_months: { 'ui:widget': 'radio' },
    residence_type: { 'ui:widget': 'radio' },
  },
  legal: {
    'ui:title': 'Navigating Background Steps',
    'ui:description':
      'Many employers run standard background checks. Knowing your history lets our team advocate for you and look for second-chance employers.',
    'ui:order': ['background_steps', 'legal_notes'],
    background_steps: { 'ui:widget': 'checkboxes' },
    legal_notes: {
      'ui:widget': 'textarea',
      'ui:options': { rows: 4 },
    },
  },
  health: {
    'ui:title': 'Health & Daily Energy',
    'ui:description':
      'We want to make sure your work environment completely respects your physical and mental well-being.',
    'ui:order': [
      'physical_limitations',
      'physical_limitations_detail',
      'wellness_appointments',
      'currently_in_treatment',
      'recovery_months',
      'medications_affecting_work',
      'medications_detail',
    ],
    physical_limitations: { 'ui:widget': 'radio' },
    physical_limitations_detail: {
      'ui:widget': 'textarea',
      'ui:options': {
        rows: 2,
        showIf: { field: 'physical_limitations', value: true },
      },
    },
    wellness_appointments: { 'ui:widget': 'checkboxes' },
    currently_in_treatment: {
      'ui:widget': 'radio',
      'ui:options': {
        showIf: { field: 'wellness_appointments', includes: 'in_recovery' },
      },
    },
    recovery_months: {
      'ui:widget': 'radio',
      'ui:options': {
        showIf: { field: 'wellness_appointments', includes: 'in_recovery' },
      },
    },
    medications_affecting_work: { 'ui:widget': 'radio' },
    medications_detail: {
      'ui:widget': 'textarea',
      'ui:options': {
        rows: 2,
        showIf: { field: 'medications_affecting_work', value: 'has_safety_needs' },
      },
    },
  },
  financial: {
    'ui:title': 'Getting Paid & Everyday Tools',
    'ui:description':
      "Let's make sure you have everything ready to receive your hard-earned paychecks and manage your resources.",
    'ui:order': [
      'current_income_source',
      'has_bank_account',
      'financial_goals',
      'budgeting_debt_focus',
    ],
    current_income_source: { 'ui:widget': 'radio' },
    has_bank_account: { 'ui:widget': 'radio' },
    financial_goals: { 'ui:widget': 'checkboxes' },
    budgeting_debt_focus: { 'ui:widget': 'radio' },
  },
  support_system: {
    'ui:title': 'Your Team & Support Network',
    'ui:description':
      "You don’t have to do this alone. Let’s look at who is already in your corner.",
    'ui:order': ['support_circle'],
    support_circle: { 'ui:widget': 'checkboxes' },
  },
  childcare: {
    'ui:title': 'Family & Caregiving',
    'ui:description':
      'If you take care of loved ones, we want to build a career plan that respects your family schedule.',
    'ui:order': ['has_dependents', 'number_of_dependents', 'childcare_arranged'],
    has_dependents: { 'ui:widget': 'radio' },
    number_of_dependents: {
      'ui:widget': 'number',
      'ui:options': {
        showIf: { field: 'has_dependents', value: true },
      },
    },
    childcare_arranged: {
      'ui:widget': 'radio',
      'ui:options': {
        showIf: { field: 'has_dependents', value: true },
      },
    },
  },
  technology: {
    'ui:title': 'Digital Connections',
    'ui:description':
      "Let's ensure you can easily check your schedule, talk to employers, and stay connected.",
    'ui:order': ['tech_tools'],
    tech_tools: { 'ui:widget': 'checkboxes' },
  },
  identification: {
    'ui:title': 'Your Launch Toolkit',
    'ui:description':
      "To wrap things up, let's look at the physical items you have ready today, and any final areas where our team can stand behind you.",
    'ui:order': ['physical_items', 'support_paths', 'other_support_detail'],
    physical_items: { 'ui:widget': 'checkboxes' },
    support_paths: { 'ui:widget': 'checkboxes' },
    other_support_detail: {
      'ui:widget': 'textarea',
      'ui:options': { rows: 2 },
    },
  },
  vocational: {
    'ui:title': 'Vocational Barriers',
    'ui:order': [
      'specific_barriers',
      'barrier_notes',
    ],
    specific_barriers: {
      'ui:widget': 'checkboxes',
    },
    barrier_notes: {
      'ui:widget': 'textarea',
      'ui:options': { rows: 3 },
    },
  },
};

// ---------------------------------------------------------------------------
// Exported template definitions
// ---------------------------------------------------------------------------

export interface AssessmentTemplate {
  name: string;
  assessment_type: string;
  vertical: string;
  json_schema: object;
  ui_schema: object;
}

export const tsrgAssessmentTemplates: AssessmentTemplate[] = [
  {
    name: 'Current Work Profile',
    assessment_type: 'current_work_profile',
    vertical: 'tsrg_workforce',
    json_schema: skillsJsonSchema,
    ui_schema: skillsUiSchema,
  },
  {
    name: 'Workstyle Strengths',
    assessment_type: 'workstyle_strengths',
    vertical: 'tsrg_workforce',
    json_schema: interestsJsonSchema,
    ui_schema: interestsUiSchema,
  },
  {
    name: 'Support Needs',
    assessment_type: 'support_needs',
    vertical: 'tsrg_workforce',
    json_schema: barriersJsonSchema,
    ui_schema: barriersUiSchema,
  },
];
