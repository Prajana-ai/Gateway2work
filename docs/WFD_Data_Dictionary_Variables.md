# Variable Data Dictionary

This document contains the detailed list of 337 variables used in the TSRG ImpactForge application, mapping them to their respective schemas, tables, and measurement types.

| ID | Variable Name | Domain / Category | Target Table | Description / Notes |
|----|---------------|-------------------|--------------|---------------------|
| 1 | Participant ID | Participant identification and record management | Participant table | Unique identifier of client/participant. Scale: ordinal. Categorical with no hierarchy (gender: male/female/non-binary). |
| 2 | External ID or referral ID | Participant identification and record management | Participant table | Enrollment table. Nominal. Categorical with hierarchy (highest degree earned: hs, bachelors, masters). |
| 3 | First name | Participant identification and record management | Participant table | Assessment table. |
| 4 | Last name | Participant identification and record management | Participant table | Services table. Definition. |
| 5 | Preferred name | Participant identification and record management | Participant table | Training table. Inbound company referring client to TSRG. |
| 6 | Date of birth | Participant identification and record management | Participant table | Employment outcomes table. Outbound TSRG referring to company. |
| 7 | Age at intake | Participant identification and record management | Participant table | Follow-up table. |
| 8 | Primary language | Participant identification and record management | Participant table | Employer table. |
| 9 | Contact phone | Participant identification and record management | Participant table | Staff table. |
| 10 | Contact email | Participant identification and record management | Participant table | Exit and Discharge table. |
| 11 | Preferred contact method | Participant identification and record management | Participant table | Reporting. |
| 12 | Mailing address | Participant identification and record management | Participant table | IPS Fidelity. |
| 13 | City | Participant identification and record management | Participant table | |
| 14 | County | Participant identification and record management | Participant table | |
| 15 | ZIP code | Participant identification and record management | Participant table | |
| 16 | Emergency contact name | Participant identification and record management | Participant table | |
| 17 | Emergency contact phone | Participant identification and record management | Participant table | |
| 18 | Consent signed | Participant identification and record management | Participant table | |
| 19 | Consent date | Participant identification and record management | Participant table | |
| 20 | Release of information signed | Participant identification and record management | Participant table | |
| 21 | ROI expiration date | Participant identification and record management | Participant table | |
| 22 | Active or inactive status | Participant identification and record management | Participant table | |
| 23 | Date record created | Participant identification and record management | Participant table | |
| 24 | Date record updated | Participant identification and record management | Participant table | |
| 25 | Staff person assigned | Participant identification and record management | Participant table | |
| 26 | Case manager or navigator assigned | Participant identification and record management | Participant table | |
| 27 | Gender | Demographics | Participant table | ordinal (categorical) |
| 28 | Pronouns | Participant identification and record management | Participant table | ordinal (categorical) |
| 29 | Race | Demographics | Participant table | ordinal (categorical) |
| 30 | Ethnicity | Demographics | Participant table | ordinal (categorical) |
| 31 | Veteran status | Demographics | Participant table | ordinal (categorical) |
| 32 | Disability status | Demographics | Participant table | ordinal (categorical) |
| 33 | Citizenship or work authorization status | Demographics | Participant table | ordinal (categorical) |
| 34 | Household size | Demographics | Participant table | ordinal (categorical) |
| 35 | Number of dependents | Demographics | Participant table | ordinal (categorical) |
| 36 | Parenting status | Demographics | Participant table | ordinal (categorical) |
| 37 | Marital status | Demographics | Participant table | ordinal (categorical) |
| 38 | Housing status at intake | Demographics | Participant table | ordinal (categorical) |
| 39 | Rural, suburban, or urban residence | Demographics | Participant table | ordinal (categorical) |
| 40 | Transportation access | Demographics | Participant table | Auto, public bus, Uber, Lyft (carpool), motorcycle, bicycle, walking. ordinal (categorical) |
| 41 | Internet access | Demographics | Participant table | ordinal (categorical) |
| 42 | Device access | Demographics | Participant table | Phone, tablet, laptop, desktop. ordinal (categorical) |
| 43 | Referral source | Referral and enrollment | Enrollment table | |
| 44 | Referral date | Referral and enrollment | Enrollment table | |
| 45 | Referral type | Referral and enrollment | Enrollment table | |
| 46 | Program enrolled in | Referral and enrollment | Enrollment table | |
| 47 | Enrollment date | Referral and enrollment | Enrollment table | |
| 48 | Intake completion date | Referral and enrollment | Enrollment table | |
| 49 | Eligibility determination | Referral and enrollment | Enrollment table | |
| 50 | Eligibility date | Referral and enrollment | Enrollment table | |
| 51 | Reason not eligible | Referral and enrollment | Enrollment table | |
| 52 | Cohort number | Referral and enrollment | Enrollment table | |
| 53 | Funding source tied to participant | Referral and enrollment | Enrollment table | |
| 54 | Recruitment source | Referral and enrollment | Enrollment table | |
| 55 | Assessment date | Referral and enrollment | Enrollment table | |
| 56 | IPS client established date | Referral and enrollment | Enrollment table | |
| 57 | Case management established client date | Referral and enrollment | Enrollment table | |
| 58 | Highest grade completed | Education and background | Assessment table | |
| 59 | Highest degree earned | Education and background | Assessment table | |
| 60 | GED status | Education and background | Assessment table | |
| 61 | School enrollment status | Education and background | Assessment table | |
| 62 | Current training enrollment status | Education and background | Assessment table | |
| 63 | Certifications held at intake | Education and background | Assessment table | |
| 64 | Driver’s license status | Education and background | Assessment table | |
| 65 | Professional licenses | Education and background | Assessment table | |
| 66 | Years of work history | Education and background | Assessment table | |
| 67 | Primary work sector history | Education and background | Assessment table | |
| 68 | Resume available | Education and background | Assessment table | |
| 69 | Resume completion date | Education and background | Assessment table | |
| 70 | Digital literacy level | Education and background | Assessment table | Internet, Microsoft, Google, AI and other software |
| 71 | English proficiency | Education and background | Assessment table | |
| 72 | Math proficiency | Education and background | Assessment table | |
| 73 | Reading proficiency | Education and background | Assessment table | |
| 74 | Employment status at intake | Employment status at intake | Assessment table | |
| 75 | Employed full time or part time | Employment status at intake | Assessment table | |
| 76 | Unemployed duration | Employment status at intake | Assessment table | |
| 77 | Underemployed status | Employment status at intake | Assessment table | |
| 78 | Current employer | Employment status at intake | Assessment table | |
| 79 | Current job title | Employment status at intake | Assessment table | |
| 80 | Hours worked per week | Employment status at intake | Assessment table | |
| 81 | Hourly wage at intake | Employment status at intake | Assessment table | |
| 82 | Monthly income at intake | Employment status at intake | Assessment table | |
| 83 | Job retention risk | Employment status at intake | Assessment table | |
| 84 | Benefits (Public) received at intake | Employment status at intake | Assessment table | |
| 85 | Employment barriers reported | Employment status at intake | Assessment table | Gender, criminal justice involvement, race, age, LGBTQ, housing status |
| 86 | Justice involved status | Justice, recovery and supportive service needs | Assessment table | |
| 87 | Reentry status | Justice, recovery and supportive service needs | Assessment table | |
| 88 | Probation or parole status | Justice, recovery and supportive service needs | Assessment table | |
| 89 | Recovery status | Justice, recovery and supportive service needs | Services table | |
| 90 | Recovery stage or self identified recovery status | Justice, recovery and supportive service needs | Services table | |
| 91 | Substance use treatment participation | Justice, recovery and supportive service needs | Services table | MOUD, NA, AA, IOP |
| 92 | Behavioral health treatment participation | Justice, recovery and supportive service needs | Services table | |
| 93 | Peer support participation | Justice, recovery and supportive service needs | Services table | |
| 94 | Housing instability | Justice, recovery and supportive service needs | Services table | |
| 95 | Food insecurity | Justice, recovery and supportive service needs | Services table | |
| 96 | Childcare need | Justice, recovery and supportive service needs | Services table | |
| 97 | Transportation need | Justice, recovery and supportive service needs | Services table | |
| 98 | Legal support need | Justice, recovery and supportive service needs | Services table | |
| 99 | Physical health need | Justice, recovery and supportive service needs | Services table | |
| 100 | Mental health need | Justice, recovery and supportive service needs | Services table | |
| 101 | Trauma informed support needed | Justice, recovery and supportive service needs | Services table | |
| 102 | Lack of transportation | Barriers to employment | Assessment table | |
| 103 | Lack of childcare | Barriers to employment | Assessment table | |
| 104 | Housing instability | Barriers to employment | Assessment table | |
| 105 | No work history | Barriers to employment | Assessment table | |
| 106 | Criminal record barrier | Barriers to employment | Assessment table | |
| 107 | Limited education | Barriers to employment | Assessment table | |
| 108 | Limited digital skills | Barriers to employment | Assessment table | |
| 109 | Limited interview skills | Barriers to employment | Assessment table | |
| 110 | Limited resume skills | Barriers to employment | Assessment table | |
| 111 | Lack of work clothing | Barriers to employment | Assessment table | |
| 112 | Lack of identification documents | Barriers to employment | Assessment table | |
| 113 | Limited access to phone or internet | Barriers to employment | Assessment table | |
| 114 | Health related barriers | Barriers to employment | Assessment table | |
| 115 | Behavioral health barriers | Barriers to employment | Assessment table | |
| 116 | Substance use related barriers | Barriers to employment | Assessment table | |
| 117 | Language barriers | Barriers to employment | Assessment table | |
| 118 | Scheduling barriers | Barriers to employment | Assessment table | |
| 119 | Confidence or motivation concerns | Barriers to employment | Assessment table | |
| 120 | Employer discrimination reported | Barriers to employment | Assessment table | |
| 121 | Other barrier | Barriers to employment | Assessment table | |
| 122 | Barrier notes | Barriers to employment | Assessment table | |
| 123 | Intake assessment completed | Assessment and baseline measures | Assessment table | |
| 124 | Intake assessment date | Assessment and baseline measures | Assessment table | |
| 125 | Employability score | Assessment and baseline measures | Assessment table | |
| 126 | Job readiness score | Assessment and baseline measures | Assessment table | |
| 127 | Self efficacy score | Assessment and baseline measures | Assessment table | |
| 128 | Work interest inventory completed | Assessment and baseline measures | Assessment table | |
| 129 | Career pathway identified | Assessment and baseline measures | Assessment table | |
| 130 | Support service assessment completed | Assessment and baseline measures | Assessment table | |
| 131 | Risk level | Assessment and baseline measures | Assessment table | |
| 132 | Acuity level | Assessment and baseline measures | Assessment table | |
| 133 | Baseline wage goal | Assessment and baseline measures | Assessment table | |
| 134 | Baseline hours goal | Assessment and baseline measures | Assessment table | |
| 135 | Career goal | Assessment and baseline measures | Assessment table | |
| 136 | Short term employment goal | Assessment and baseline measures | Assessment table | |
| 137 | Long term employment goal | Assessment and baseline measures | Assessment table | |
| 138 | Service ID | Services received | Services table | |
| 139 | Participant ID | Services received | Services table | |
| 140 | Service date | Services received | Services table | |
| 141 | Service type | Services received | Services table | |
| 142 | Service subcategory | Services received | Services table | |
| 143 | Staff providing service | Services received | Services table | |
| 144 | Partner organization providing service | Services received | Services table | |
| 145 | Duration of service | Services received | Services table | |
| 146 | Service location | Services received | Services table | |
| 147 | In person or virtual | Services received | Services table | |
| 148 | Group or individual | Services received | Services table | |
| 149 | Service completed | Services received | Services table | |
| 150 | Notes | Services received | Services table | |
| 151 | Application assistance | Services received | Services table | |
| 152 | Benefits counseling | Services received | Services table | Need nominal/categorical variables for each to enable reporting specificity |
| 153 | Career coaching | Services received | Services table | Need categorical variables for each to enable reporting specificity |
| 154 | Case management | Services received | Services table | Need categorical variables for each to enable reporting specificity |
| 155 | Childcare assistance | Services received | Services table | Need categorical variables for each to enable reporting specificity |
| 156 | Digital literacy training | Services received | Services table | Need categorical variables for each to enable reporting specificity |
| 157 | Educational advising | Services received | Services table | Need categorical variables for each to enable reporting specificity |
| 158 | Employer engagement activity | Services received | Services table | Need categorical variables for each to enable reporting specificity |
| 159 | Financial literacy training | Services received | Services table | Need categorical variables for each to enable reporting specificity |
| 160 | Interview preparation | Services received | Services table | Need categorical variables for each to enable reporting specificity |
| 161 | IPS services | Services received | Services table | Need categorical variables for each to enable reporting specificity |
| 162 | Job readiness training | Services received | Services table | Need categorical variables for each to enable reporting specificity |
| 163 | Job search assistance | Services received | Services table | Need categorical variables for each to enable reporting specificity |
| 164 | Next step recommended | Services received | Services table | Need categorical variables for each to enable reporting specificity |
| 165 | Peer support | Services received | Services table | |
| 166 | Recovery support | Services received | Services table | |
| 167 | Referral to housing | Services received | Services table | |
| 168 | Referral to legal support | Services received | Services table | |
| 169 | Referral to treatment | Services received | Services table | |
| 170 | Resume assistance | Services received | Services table | |
| 171 | Supported employment | Services received | Services table | |
| 172 | Transportation assistance | Services received | Services table | |
| 173 | Work clothing or equipment support | Services received | Services table | |
| 174 | Training program name | Training and credential attainment | Training table | |
| 175 | Training provider | Training and credential attainment | Training table | |
| 176 | Training start date | Training and credential attainment | Training table | |
| 177 | Training end date | Training and credential attainment | Training table | |
| 178 | Training completed | Training and credential attainment | Training table | |
| 179 | Completion date | Training and credential attainment | Training table | |
| 180 | Credential earned | Training and credential attainment | Training table | |
| 181 | Credential type | Training and credential attainment | Training table | |
| 182 | License earned | Training and credential attainment | Training table | |
| 183 | Apprenticeship participation | Training and credential attainment | Training table | |
| 184 | Internship participation | Training and credential attainment | Training table | |
| 185 | Work based learning participation | Training and credential attainment | Training table | |
| 186 | On the job training participation | Training and credential attainment | Training table | |
| 187 | Total training hours | Training and credential attainment | Training table | |
| 188 | Stipend provided | Training and credential attainment | Training table | |
| 189 | Training outcome | Training and credential attainment | Training table | |
| 190 | Job placement achieved | Job Placement | Employment outcomes table | |
| 191 | Placement date | Job Placement | Employment outcomes table | |
| 192 | Employer name | Job Placement | Employment outcomes table | |
| 193 | Employer industry | Job Placement | Employment outcomes table | |
| 194 | Job title | Job Placement | Employment outcomes table | |
| 195 | Occupation code if used | Job Placement | Employment outcomes table | |
| 196 | Employment type | Job Placement | Employment outcomes table | |
| 197 | Full time or part time | Job Placement | Employment outcomes table | |
| 198 | Permanent, temporary, seasonal | Job Placement | Employment outcomes table | |
| 199 | Starting wage | Job Placement | Employment outcomes table | |
| 200 | Expected weekly hours | Job Placement | Employment outcomes table | |
| 201 | Benefits offered | Job Placement | Employment outcomes table | Minimum hours required |
| 202 | Worksite location | Job Placement | Employment outcomes table | |
| 203 | Remote, hybrid, or on site | Job Placement | Employment outcomes table | |
| 204 | Recovery friendly workplace | Job Placement | Employment outcomes table | |
| 205 | Second chance employer | Job Placement | Employment outcomes table | |
| 206 | Union job | Job Placement | Employment outcomes table | |
| 207 | Placement quality rating | Job Placement | Employment outcomes table | Competitive, non-competitive |
| 208 | Employed at 30 days | Retention and Advancement | Employment outcomes table | |
| 209 | Employed at 60 days | Retention and Advancement | Employment outcomes table | |
| 210 | Employed at 90 days | Retention and Advancement | Employment outcomes table | |
| 211 | Employed at 6 months | Retention and Advancement | Employment outcomes table | |
| 212 | Employed at 12 months | Retention and Advancement | Employment outcomes table | |
| 213 | Retention verification date | Retention and Advancement | Employment outcomes table | |
| 214 | Wage at 30 days | Retention and Advancement | Employment outcomes table | |
| 215 | Wage at 90 days | Retention and Advancement | Employment outcomes table | |
| 216 | Wage at 6 months | Retention and Advancement | Employment outcomes table | |
| 217 | Promotion received | Retention and Advancement | Employment outcomes table | |
| 218 | Promotion date | Retention and Advancement | Employment outcomes table | |
| 219 | Increase in hours | Retention and Advancement | Employment outcomes table | |
| 220 | Benefits gained | Retention and Advancement | Employment outcomes table | |
| 221 | Job satisfaction | Retention and Advancement | Employment outcomes table | |
| 222 | Employer satisfaction | Retention and Advancement | Employment outcomes table | |
| 223 | Reason employment ended | Retention and Advancement | Employment outcomes table | |
| 224 | Date employment ended | Retention and Advancement | Employment outcomes table | |
| 225 | Housing improved | Supportive Service Outcomes | Follow-up table | |
| 226 | Transportation access improved | Supportive Service Outcomes | Follow-up table | |
| 227 | Childcare secured | Supportive Service Outcomes | Follow-up table | |
| 228 | Identification documents obtained | Supportive Service Outcomes | Follow-up table | |
| 229 | Resume completed | Supportive Service Outcomes | Follow-up table | |
| 230 | Interview completed | Supportive Service Outcomes | Follow-up table | |
| 231 | Applications submitted | Supportive Service Outcomes | Follow-up table | |
| 232 | Interviews scheduled | Supportive Service Outcomes | Follow-up table | |
| 233 | Interviews attended | Supportive Service Outcomes | Follow-up table | |
| 234 | Job offer received | Supportive Service Outcomes | Follow-up table | |
| 235 | Job offer accepted | Supportive Service Outcomes | Follow-up table | |
| 236 | Education program being pursued | Supportive Service Outcomes | Follow-up table | |
| 237 | Treatment engagement | Supportive Service Outcomes | Follow-up table | |
| 238 | Recovery support engagement | Supportive Service Outcomes | Follow-up table | |
| 239 | Increased self confidence | Supportive Service Outcomes | Follow-up table | |
| 240 | Increased digital literacy | Supportive Service Outcomes | Follow-up table | |
| 241 | Exit date | Exit and Discharge | Exit and Discharge table | |
| 242 | Exit reason | Exit and Discharge | Exit and Discharge table | |
| 243 | Completed program successfully | Exit and Discharge | Exit and Discharge table | |
| 244 | Withdrew voluntarily | Exit and Discharge | Exit and Discharge table | |
| 245 | Lost contact | Exit and Discharge | Exit and Discharge table | |
| 246 | Referred to another program | Exit and Discharge | Exit and Discharge table | |
| 247 | Incarcerated | Exit and Discharge | Exit and Discharge table | |
| 248 | Hospitalized | Exit and Discharge | Exit and Discharge table | |
| 249 | Deceased | Exit and Discharge | Exit and Discharge table | |
| 250 | Non-completion of workforce program upon exit | Exit and Discharge | Exit and Discharge table | |
| 251 | Completion of workforce program upon exit | Exit and Discharge | Employer name and location | |
| 252 | Employment status at exit | Exit and Discharge | Exit and Discharge table | |
| 253 | Wage at exit | Exit and Discharge | Exit and Discharge table | |
| 254 | Notes at exit | Exit and Discharge | Exit and Discharge table | |
| 255 | Follow up due date | Follow-up and longitudinal tracking | Follow-up table | |
| 256 | Follow up completed date | Follow-up and longitudinal tracking | Follow-up table | |
| 257 | Follow up method | Follow-up and longitudinal tracking | Follow-up table | |
| 258 | Follow up status | Follow-up and longitudinal tracking | Follow-up table | |
| 259 | Employment at follow up | Follow-up and longitudinal tracking | Follow-up table | |
| 260 | Wage at follow up | Follow-up and longitudinal tracking | Follow-up table | |
| 261 | Education status at follow up | Follow-up and longitudinal tracking | Follow-up table | |
| 262 | Housing status at follow up | Follow-up and longitudinal tracking | Follow-up table | |
| 263 | Continued service needs | Follow-up and longitudinal tracking | Follow-up table | Housing, food, clothing, training, etc. |
| 264 | Reengaged in program | Follow-up and longitudinal tracking | Follow-up table | |
| 265 | Long term goal progress | Follow-up and longitudinal tracking | Follow-up table | |
| 266 | Follow up notes | Follow-up and longitudinal tracking | Follow-up table | |
| 267 | Service Provider ID | In-Bound Partner Variables | Employer table | |
| 268 | Service Provider name | In-Bound Partner Variables | Employer table | |
| 269 | Industry | In-Bound Partner Variables | Employer table | |
| 270 | Contact person | In-Bound Partner Variables | Employer table | |
| 271 | Contact title | In-Bound Partner Variables | Employer table | |
| 272 | Contact email | In-Bound Partner Variables | Employer table | |
| 273 | Contact phone | In-Bound Partner Variables | Employer table | |
| 274 | Employer address | In-Bound Partner Variables | Employer table | |
| 275 | Partnership start date | In-Bound Partner Variables | Employer table | |
| 276 | Number of participants referred | In-Bound Partner Variables | Employer table | |
| 277 | Number of participants hired | In-Bound Partner Variables | Employer table | |
| 278 | Number retained at 90 days | In-Bound Partner Variables | Employer table | |
| 279 | Employer ID | Out-Bound Partner Variables | Employer table | |
| 280 | Employer name | Out-Bound Partner Variables | Employer table | |
| 281 | Industry | Out-Bound Partner Variables | Employer table | |
| 282 | Contact person | Out-Bound Partner Variables | Employer table | |
| 283 | Contact title | Out-Bound Partner Variables | Employer table | |
| 284 | Contact email | Out-Bound Partner Variables | Employer table | |
| 285 | Contact phone | Out-Bound Partner Variables | Employer table | |
| 286 | Employer address | Out-Bound Partner Variables | Employer table | |
| 287 | Recovery friendly employer | Out-Bound Partner Variables | Employer table | |
| 288 | Fair chance employer | Out-Bound Partner Variables | Employer table | |
| 289 | Hiring sectors | Out-Bound Partner Variables | Employer table | |
| 290 | Entry level openings | Out-Bound Partner Variables | Employer table | |
| 291 | Salary | Out-Bound Partner Variables | Employer table | ordinal (minimum wage, competitive wage, livable wage) |
| 292 | Benefits offered | Out-Bound Partner Variables | Employer table | |
| 293 | Partnership start date | Out-Bound Partner Variables | Employer table | |
| 294 | Number of participants referred | Out-Bound Partner Variables | Employer table | |
| 295 | Number of participants hired | Out-Bound Partner Variables | Employer table | |
| 296 | Number retained at 90 days | Out-Bound Partner Variables | Employer table | |
| 297 | Total enrolled | Recommended Reporting Variables | Reporting | |
| 298 | Total active participants | Recommended Reporting Variables | Reporting | |
| 299 | Total exited | Recommended Reporting Variables | Reporting | |
| 300 | Number receiving case management | Recommended Reporting Variables | Reporting | |
| 301 | Number receiving training | Recommended Reporting Variables | Reporting | |
| 302 | Number earning credentials | Recommended Reporting Variables | Reporting | |
| 303 | Number placed in employment | Recommended Reporting Variables | Reporting | |
| 304 | Median wage at placement | Recommended Reporting Variables | Reporting | |
| 305 | Retention at 90 days | Recommended Reporting Variables | Reporting | |
| 306 | Retention at 6 months | Recommended Reporting Variables | Reporting | |
| 307 | Average time from intake to placement | Recommended Reporting Variables | Reporting | |
| 308 | Average number of services per participant | Recommended Reporting Variables | Reporting | |
| 309 | Top barriers | Recommended Reporting Variables | Reporting | |
| 310 | Top referral sources | Recommended Reporting Variables | Reporting | |
| 311 | Top industries for placement | Recommended Reporting Variables | Reporting | |
| 312 | Competitive work | IPS Fidelity Review Variables | IPS Fidelity | % of clients that have competitive work secured through the IPS model. BHA measures what % of IPS clients are actively engaged in competitive work. |
| 313 | Provider Caseload Size | IPS Fidelity Review Variables | IPS Fidelity | Ideally IPS provider has less than 25 clients on caseload. Staffing component of IPS fidelity. |
| 314 | Employment Services Staff | IPS Fidelity Review Variables | IPS Fidelity | IPS specialists only provide employment related services. Staffing component of IPS fidelity. |
| 315 | Vocational Generalists | IPS Fidelity Review Variables | IPS Fidelity | IPS specialist carries out every phase of employment service. Staffing component of IPS fidelity. |
| 316 | Mental health team integration | IPS Fidelity Review Variables | IPS Fidelity | IPS specialists are part of mental health treatment teams from which 90% of their caseload is derived. Organization component of IPS fidelity. |
| 317 | Mental health provider contact | IPS Fidelity Review Variables | IPS Fidelity | IPS specialists actively participate in weekly mental health team treatment meetings. Organization component of IPS fidelity. |
| 318 | IPS and VR collaboration | IPS Fidelity Review Variables | IPS Fidelity | IPS specialists and Vocational Rehabilitation counselors are in frequent contact. Organization component of IPS fidelity. |
| 319 | Vocational Unit | IPS Fidelity Review Variables | IPS Fidelity | 2 full time IPS specialists and one IPS manager comprise a vocational unit. Organization component of IPS fidelity. |
| 320 | IPS Supervisor | IPS Fidelity Review Variables | IPS Fidelity | IPS specialist skills are developed and improved upon through supervision. Organization component of IPS fidelity. |
| 321 | Zero exclusion | IPS Fidelity Review Variables | IPS Fidelity | clients interested in working have access to IPS regardless of job readiness. Organization component of IPS fidelity. |
| 322 | Competitive employment | IPS Fidelity Review Variables | IPS Fidelity | Agency promotes work through strategies of screening interest, displaying postings about IPS. Organization component of IPS fidelity. |
| 323 | Exec support IPS | IPS Fidelity Review Variables | IPS Fidelity | Agency team members (CEO, COO, Director, etc.) assist in implementation and sustainability. Organization component of IPS fidelity. |
| 324 | Work incentive planning | IPS Fidelity Review Variables | IPS Fidelity | clients are offered assistance in obtaining comprehensive, individualized work incentives planning. Services component of IPS fidelity. |
| 325 | Disclosure | IPS Fidelity Review Variables | IPS Fidelity | IPS specialists provide clients with accurate information regarding revealing disability to employer. Services component of IPS fidelity. |
| 326 | Work-based Vocational Assessment | IPS Fidelity Review Variables | IPS Fidelity | vocational profile that includes preferences, experiences, skills, strengths is updated. Services component of IPS fidelity. |
| 327 | Rapid job-search | IPS Fidelity Review Variables | IPS Fidelity | first face-to-face employer contact occurs within 30 days of client entering the program. Services component of IPS fidelity. |
| 328 | Individualized job search | IPS Fidelity Review Variables | IPS Fidelity | IPS specialists forms employer contacts based on client's preferences, strengths, and symptoms. Services component of IPS fidelity. |
| 329 | Frequent employer contact | IPS Fidelity Review Variables | IPS Fidelity | IPS specialist makes at least 6 face-to-face employer contacts weekly. Services component of IPS fidelity. |
| 330 | Employer contact quality | IPS Fidelity Review Variables | IPS Fidelity | IPS builds relationships with employers through planned visits. Services component of IPS fidelity. |
| 331 | Job type diversity | IPS Fidelity Review Variables | IPS Fidelity | IPS specialists help in obtaining different types of jobs. Services component of IPS fidelity. |
| 332 | Employer diversity | IPS Fidelity Review Variables | IPS Fidelity | IPS specialists help in obtaining jobs through a variety of employers. Services component of IPS fidelity. |
| 333 | Competitive jobs | IPS Fidelity Review Variables | IPS Fidelity | IPS specialists provide competitive job options that have permanent status. Services component of IPS fidelity. |
| 334 | individualized follow-along supports | IPS Fidelity Review Variables | IPS Fidelity | clients receive different types of support based on the job, preferences, and work history. Services component of IPS fidelity. |
| 335 | Time-unlimited follow-along supports | IPS Fidelity Review Variables | IPS Fidelity | IPS specialists have face-to-face contact with client at specific intervals (1 week before, 3 days after, etc.). Services component of IPS fidelity. |
| 336 | Community-based services | IPS Fidelity Review Variables | IPS Fidelity | Employment services are provided in natural community settings. Services component of IPS fidelity. |
| 337 | Assertive engagement by integrated team | IPS Fidelity Review Variables | IPS Fidelity | Service termination is not based on missed appointments. Engagement attempts are made by integrated team. Services component of IPS fidelity. |

## Funding Streams

| Name | Description |
|------|-------------|
| AI WIN | Potential grant funding to support program. Competitive application will be reviewed and decided by September 2026 |
| AmeriCorps | Current funding source for Vista Member resources (2 headcount per year) |
| BHASO | Receives block grant funding for the State of Colorado and will potentially be a source for workforce development. Needs to be fully researched as to how we establish relationship and support for our program. |
| CDOO | Potential grant funding to support program. Competitive application that is posted via BidNet. Current cycle ended on 3.14.2026. There will be additional funding opportunities, but we need to monitor the BidNet site and the CDOO/KDOO postings. |
| Colorado Health Foundation | Potential grant funding to support program. Competitive application that is posted the CHF website. Need to reach out to program officers. |
| Colorado Trust | Potential grant funding to support program. There are not current funding opportunities posted, but I need to follow-up with Mia Ramirez. |
| DVR | Potential grant funding to support program. Need to fully research how to plug into this funding stream. We need a contact and to research more fully. |
| HCPF | It is unclear how HCPF funding is made available. Need to research more fully to understand if the funding goes through the RAEs, the treatment providers or how. |
| HRSA | Impact grant will be posted in March or April. Is this a funding stream for the program in SE Colorado? |
| KDOO | Not sure if the acronym is CDOO or KDOO for the funding streatm. Potential grant funding to support program. Competitive application that is posted via BidNet. Current cycle ended on 3.14.2026. There will be additional funding opportunities, but we need to monitor the BidNet site and the CDOO/KDOO postings. |
| RAE | I believe this is the entity that controls Medicaid eligibility, but need to research more fully. |
| SAMSHA | Distributes block grant funding. Need to understand how the funds are distributed in the State of Colorado and how to access via the RAE, BHASO or the treatment centers. |

## Terms and Definitions

| Term | Definition |
|------|------------|
| BHA | The Colorado Behavioral Health Administration (BHA) is the state agency responsible for leading, coordinating, and transforming Colorado’s behavioral health system, including both mental health and substance use disorder services. |
| BHASO | Behavioral Health Administrative Service Organizations (BHASOs) are regional entities designated by the Colorado Behavioral Health Administration (BHA) to manage, coordinate, and administer publicly funded behavioral health services across defined geographic regions in Colorado. They serve as the administrative backbone of the state’s behavioral health system, ensuring that individuals can access mental health and substance use services in a coordinated, accountable, and regionally responsive way. |
| Case Management Billing | Case management services provided through this program are designed to support individuals with diagnosed substance use disorders by addressing barriers to recovery and stability, including unemployment. Employment is incorporated as a key recovery goal, with services focused on care coordination, service planning, and linkage to supports that reduce relapse risk and improve long-term health outcomes. All services are delivered in accordance with Medicaid requirements for medical necessity and person-centered care. |
| CDOO | The Colorado Disability Opportunity Office (CDOO) is a statewide office within the Colorado Department of Labor and Employment (CDLE) that works to improve access, independence, and quality of life for people with disabilities across Colorado. CDOO leads cross agency coordination, policy development, and strategic investments to reduce barriers and expand opportunities for individuals with disabilities in areas such as employment, housing, healthcare, and community integration. |
| CPHI | The Colorado Public Health Innovation Office (CPHI) is a statewide initiative within the Colorado Department of Public Health and Environment (CDPHE) that focuses on modernizing public health systems through data, collaboration, and innovation. Its purpose is to strengthen Colorado’s ability to respond to complex health challenges by supporting cross sector partnerships, improving data infrastructure, and advancing evidence informed decision making. |
| DVR | The Colorado Division of Vocational Rehabilitation (DVR) is a state and federally funded program that helps individuals with disabilities prepare for, obtain, and maintain employment. DVR operates within Colorado state government and provides individualized services designed to reduce barriers to work and support long term economic independence. Services may include vocational counseling and guidance, job training, education support, assistive technology, job placement assistance, and workplace accommodations. DVR also partners with employers to support inclusive hiring practices and to ensure that individuals with disabilities can successfully participate in the workforce. In Colorado, DVR operates under the Colorado Department of Labor and Employment and is funded through a combination of federal and state resources, primarily under the Rehabilitation Act of 1973, as amended by the Workforce Innovation and Opportunity Act (WIOA). DVR prioritizes serving individuals with the most significant disabilities and works collaboratively with community organizations, healthcare providers, educational institutions, and workforce centers to deliver coordinated, person-centered services that promote long-term employment outcomes and economic self-sufficiency. |
| Fidelity | Fidelity is the degree to which a supported employment program implements the core principles, practices, and structure of the IPS model with accuracy and consistency. High fidelity indicates that the program is delivering services in alignment with the IPS evidence base, which is strongly associated with better employment outcomes for participants. |
| Fidelity scale | What Fidelity Includes in IPS Fidelity is typically assessed using a standardized tool (such as the IPS Fidelity Scale) and evaluates key components such as: Zero exclusion All individuals who want to work are eligible, regardless of readiness, symptoms, or substance use status Competitive integrated employment focus Emphasis on helping participants obtain regular jobs in the community rather than sheltered or transitional work Rapid job search Job search begins quickly rather than after lengthy pre-employment training Integration with behavioral health services Employment specialists are embedded within treatment teams Benefits counseling Participants receive guidance on how employment impacts public benefits Time-unlimited, individualized support Ongoing support tailored to the individual’s needs Systematic job development Employment specialists build relationships with employers based on participant preferences |
| HCPF | The Colorado Department of Health Care Policy and Financing (HCPF), as the state’s Medicaid agency, plays a critical role in workforce development by defining reimbursable services, provider qualifications, and payment structures that enable or limit the sustainability of workforce-related programs. While not a direct workforce funder, HCPF finances key services such as case management, behavioral health treatment, and peer support that support employment outcomes and workforce participation for Medicaid members. HCPF reimburses workforce-related services primarily through Targeted Case Management (T1017), peer support (H0038), and behavioral health outreach (H0023), which support care coordination, engagement, and stabilization for Medicaid members. Direct supported employment services are not broadly reimbursable under the Medicaid State Plan in Colorado but may be funded through HCBS waivers, Regional Accountable Entity contracts, or alternative payment models, requiring braided funding approaches for IPS-aligned workforce programs. |
| KDOO | Refers to a separate provider entity that delivers services to individuals with IDD These organizations: Provide direct services (residential, day services, supported employment, etc.) Are not the CCB Must be approved and enrolled through the state |
| Medicaid waiver | IPS (Individual Placement and Support) is an evidence-based model, not a billing code Medicaid pays for service components that align with IPS, not “IPS” itself In Colorado, funding comes from: HCBS waivers Behavioral health managed care (RAEs) Limited State Plan services (case management, peer support) Even though waivers help, IPS is most commonly funded through: Regional Accountable Entities (RAEs) Managed care entities under Colorado Department of Health Care Policy and Financing Pay for behavioral health services through capitation ✔ IPS teams are often: Embedded in community mental health centers Funded through RAE contracts, not fee-for-service billing |
| NEON project | The NE Project is a state-supported initiative focused on improving employment outcomes for individuals with behavioral health conditions, particularly those with serious mental illness (SMI) and substance use disorders (SUD). It is closely tied to: Expansion of Individual Placement and Support (IPS) supported employment Integration of behavioral health and workforce systems Use of data and outcomes to improve employment services |
| RAE | A Regional Accountable Entity (RAE) is a Medicaid-managed care organization in Colorado responsible for coordinating, financing, and overseeing integrated physical and behavioral health services for members within a defined region. AEs → manage Medicaid-covered services BHASOs → fill gaps for: People not on Medicaid Crisis and safety-net services |
| SEEKS model | The SEEKS model is a framework used in behavioral health and workforce development, particularly in Colorado and IPS-aligned programs, to describe the core functions of supported employment and recovery-oriented services. The SEEKS model is a service delivery framework that outlines five key components needed to support individuals with behavioral health conditions in achieving and maintaining employment: S – Skills E – Engagement E – Employment K – Knowledge S – Supports |
| Supported employment | Supported employment is a service approach that helps individuals with disabilities or behavioral health conditions obtain and maintain competitive, integrated employment in the community through individualized, ongoing support. Supported employment is characterized by: A focus on real jobs in competitive settings Services tailored to individual strengths, preferences, and goals Rapid job search, rather than extended pre-employment training Ongoing, time-unlimited support to sustain employment Integration with healthcare or behavioral health services when appropriate |
| Supportive employment | Supportive employment is a general term used to describe any employment approach that includes supports to help individuals succeed at work. What It Typically Means Workforce programs that provide: Coaching Case management Wraparound services May include: Transitional jobs Training programs Recovery-oriented workforce initiatives ✔ It is a descriptive phrase, not tied to a specific evidence-based model or billing structure |
| Voc Rehab | Vocational Rehabilitation (VR) is a federally and state-funded program that helps individuals with disabilities prepare for, obtain, maintain, or advance in competitive integrated employment through individualized services and supports. |
