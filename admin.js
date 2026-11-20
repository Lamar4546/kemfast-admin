const URL = import.meta.env?.VITE_SUPABASE_URL;
const KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY;
const loginPanel = document.querySelector('#login-panel');
const dashboard = document.querySelector('#dashboard');
const loginForm = document.querySelector('#login-form');
const errorBox = document.querySelector('#admin-error');
const signout = document.querySelector('#signout');
const detailsModal = document.querySelector('#details-modal');
let accessToken = null;

function showError(message) { errorBox.textContent = message; errorBox.hidden = false; }
function setSignedIn(signedIn) { loginPanel.hidden = signedIn; dashboard.hidden = !signedIn; signout.hidden = !signedIn; }
function dateLabel(date) { return new Intl.DateTimeFormat('en-JM', { dateStyle: 'medium' }).format(new Date(date)); }
function safe(value) { const span = document.createElement('span'); span.textContent = value ?? ''; return span.innerHTML; }

async function loadApplications() {
  const response = await fetch(`${URL}/rest/v1/loan_applications?select=*&order=created_at.desc&limit=200`, {
    headers: { apikey: KEY, Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) throw new Error(response.status === 403 ? 'Your account does not have permission to view applications.' : 'Could not load applications. Please try again.');
  const applications = await response.json();
  document.querySelector('#total-count').textContent = applications.length;
  document.querySelector('#new-count').textContent = applications.length;
  const body = document.querySelector('#applications-body');
  body.replaceChildren();
  document.querySelector('#empty-state').hidden = applications.length > 0;
  for (const row of applications) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><strong>${safe(row.first_name)} ${safe(row.last_name)}</strong><small>${safe(row.parish)} · ${safe(row.town)}</small></td><td><strong>${safe(row.phone)}</strong><small>${safe(row.email)}</small></td><td><strong>JMD $${Number(row.loan_amount).toLocaleString('en-JM')}</strong><small>${safe(row.loan_purpose)} · ${safe(row.loan_term)}</small></td><td><strong>${safe(row.employer_name)}</strong><small>${safe(row.job_title)}</small></td><td>${safe(dateLabel(row.created_at))}</td>`;
    tr.tabIndex = 0;
    tr.setAttribute('aria-label', `View ${row.first_name} ${row.last_name} application details`);
    tr.addEventListener('click', () => showDetails(row));
    tr.addEventListener('keydown', event => { if (event.key === 'Enter') showDetails(row); });
    body.append(tr);
  }
}

function showDetails(row) {
  document.querySelector('#modal-name').textContent = `${row.first_name} ${row.last_name}`;
  const labels = { created_at: 'Submitted', first_name: 'First name', middle_name: 'Middle name', last_name: 'Last name', date_of_birth: 'Date of birth', trn: 'TRN', id_type: 'ID type', phone: 'Mobile number', other_phone: 'Other phone', email: 'Email address', home_address: 'Home address', town: 'Town / city', parish: 'Parish', residence: 'Residence', time_at_address: 'Time at this address', employment_status: 'Employment status', employment_duration: 'Employment duration', employer_name: 'Employer / business name', employer_sector: 'Employer sector', job_title: 'Job title / occupation', branch_department: 'Branch / department', company_address: 'Company / work address', company_phone: 'Company phone', supervisor_name: 'Supervisor / manager', supervisor_phone: 'Supervisor phone', salary_deduction_allowed: 'Salary deduction allowed', pay_frequency: 'Pay frequency', net_pay: 'Net pay per pay period (JMD)', next_pay_date: 'Next pay date', has_additional_income: 'Additional income', loan_amount: 'Amount requested (JMD)', loan_term: 'Preferred term', loan_purpose: 'Loan purpose', repayment_route: 'Repayment / security route', promo_code: 'Promo code', loan_explanation: 'Loan purpose explanation', has_off_payroll_loans: 'Loans not recorded on payslip', family_ref_name: 'Family reference name', family_ref_phone: 'Family reference phone', family_ref_relationship: 'Family reference relationship', family_ref_address: 'Family reference address', other_ref_name: 'Non-family reference name', other_ref_phone: 'Non-family reference phone', other_ref_relationship: 'Non-family reference relationship', other_ref_address: 'Non-family reference address', documents: 'Documents ready', terms_accepted: 'Terms and privacy accepted', marketing_consent: 'Marketing consent' };
  const fields = document.querySelector('#modal-fields');
  fields.replaceChildren();
  for (const [key, label] of Object.entries(labels)) {
    const value = key === 'created_at' ? dateLabel(row[key]) : (key === 'net_pay' || key === 'loan_amount') && row[key] !== null ? `JMD $${Number(row[key]).toLocaleString('en-JM')}` : Array.isArray(row[key]) ? row[key].join(', ') || 'None selected' : row[key];
    if (value === null || value === undefined || value === '') continue;
    const item = document.createElement('div'); item.className = 'detail-item';
    const title = document.createElement('span'); title.textContent = label;
    const detail = document.createElement('strong'); detail.textContent = String(value);
    item.append(title, detail); fields.append(item);
  }
  detailsModal.showModal();
}

async function signInWithToken(token) {
  accessToken = token;
  try { await loadApplications(); setSignedIn(true); }
  catch (error) { sessionStorage.removeItem('kemlan_admin_session'); accessToken = null; setSignedIn(false); showError(error.message); }
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!URL || !KEY) return showError('Admin database is not configured yet. Add the Supabase settings to .env.local.');
  errorBox.hidden = true;
  const button = loginForm.querySelector('button'); button.disabled = true; button.textContent = 'Signing in…';
  const form = new FormData(loginForm);
  try {
    const response = await fetch(`${URL}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) });
    const session = await response.json();
    if (!response.ok) throw new Error(session.msg || session.message || 'Sign in failed. Check your email and password.');
    sessionStorage.setItem('kemlan_admin_session', session.access_token);
    await signInWithToken(session.access_token);
  } catch (error) { showError(error.message); }
  finally { button.disabled = false; button.innerHTML = 'Sign in <span>→</span>'; }
});

signout.addEventListener('click', () => { sessionStorage.removeItem('kemlan_admin_session'); accessToken = null; setSignedIn(false); });
document.querySelector('#close-modal').addEventListener('click', () => detailsModal.close());
detailsModal.addEventListener('click', event => { if (event.target === detailsModal) detailsModal.close(); });
document.querySelector('#refresh').addEventListener('click', async () => { try { await loadApplications(); } catch (error) { showError(error.message); } });
const session = sessionStorage.getItem('kemlan_admin_session');
if (session && URL && KEY) signInWithToken(session);
