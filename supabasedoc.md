 1) Auth
Configuration
Email Templates
Email Templates

Learn how to manage the email templates in Supabase.

Email templates in Supabase fall into two categories: authentication and security notifications.

Authentication emails:

Confirm sign up
Invite user
Magic link
Change email address
Reset password
Reauthentication
Security notification emails:

Password changed
Email address changed
Phone number changed
Identity linked
Identity unlinked
Multi-factor authentication (MFA) method added
Multi-factor authentication (MFA) method removed
Security emails are only sent to users if the respective security notifications have been enabled at a project-level.

Terminology#
The templating system provides the following variables for use:

Name	Description
{{ .ConfirmationURL }}	Contains the confirmation URL. For example, a signup confirmation URL would look like: https://project-ref.supabase.co/auth/v1/verify?token={{ .TokenHash }}&type=email&redirect_to=https://example.com/path.
{{ .Token }}	Contains a 6-digit One-Time-Password (OTP) that can be used instead of the {{. ConfirmationURL }}.
{{ .TokenHash }}	Contains a hashed version of the {{ .Token }}. This is useful for constructing your own email link in the email template.
{{ .SiteURL }}	Contains your application's Site URL. This can be configured in your project's authentication settings.
{{ .RedirectTo }}	Contains the redirect URL passed when signUp, signInWithOtp, signInWithOAuth, resetPasswordForEmail or inviteUserByEmail is called. The redirect URL allow list can be configured in your project's authentication settings.
{{ .Data }}	Contains metadata from auth.users.user_metadata. Use this to personalize the email message.
{{ .Email }}	Contains the original email address of the user. Empty when when trying to link an email address to an anonymous user.
{{ .NewEmail }}	Contains the new email address of the user. This variable is only supported in the "Change email address" template.
{{ .OldEmail }}	Contains the old email address of the user. This variable is only supported in the "Email address changed notification" template.
{{ .Phone }}	Contains the new phone number of the user. This variable is only supported in the "Phone number changed notification" template.
{{ .OldPhone }}	Contains the old phone address of the user. This variable is only supported in the "Phone number changed notification" template.
{{ .Provider }}	Contains the provider of the newly linked/unlinked identity. This variable is only supported in the "Identity linked notification" and "Identity unlinked notification" templates.
{{ .FactorType }}	Contains the type of the newly enrolled/unenrolled MFA method. This variable is only supported in the "MFA method added notification" and "MFA method removed notification" templates.
Editing email templates#
On hosted Supabase projects, edit your email templates on the Email Templates page. On self-hosted projects or in local development, edit your configuration files.

You can also manage email templates using the Management API:

# Get your access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"
# Get current email templates
curl -X GET "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  | jq 'to_entries | map(select(.key | startswith("mailer_templates"))) | from_entries'
# Update email templates
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
      "mailer_subjects_confirmation": "Confirm your signup",
      "mailer_templates_confirmation_content": "<h2>Confirm your signup</h2><p>Follow this link to confirm your user:</p><p><a href=\"{{ .ConfirmationURL }}\">Confirm your email</a></p>",
      "mailer_subjects_magic_link": "Your Magic Link",
      "mailer_templates_magic_link_content": "<h2>Magic Link</h2><p>Follow this link to login:</p><p><a href=\"{{ .ConfirmationURL }}\">Log In</a></p>",
      "mailer_subjects_recovery": "Rest Your Password",
      "mailer_templates_recovery_content": "<h2>Reset Password</h2><p>Follow this link to reset the password for your user:</p><p><a href=\"{{ .ConfirmationURL }}\">Reset Password</a></p>",
      "mailer_subjects_invite": "You have been invited",
      "mailer_templates_invite_content": "<h2>You have been invited</h2><p>You have been invited to create a user on {{ .SiteURL }}. Follow this link to accept the invite:</p><p><a href=\"{{ .ConfirmationURL }}\">Accept the invite</a></p>",
      "mailer_subjects_reauthentication": "Confirm reauthentication",
      "mailer_templates_reauthentication_content": "<h2>Confirm reauthentication</h2><p>Enter the code: {{token}}</p>",
      "mailer_subjects_email_change": "Confirm email change",
      "mailer_templates_email_change_content": "<h2>Confirm email change</h2><p>Follow this link to confirm the update of your email:</p><p><a href=\"{{ .ConfirmationURL }}\">Change email</a></p>",
      "mailer_notifications_password_changed_enabled": true,
      "mailer_subjects_password_changed_notification": "Your password has been changed",
      "mailer_templates_password_changed_notification_content": "<h2>Your password has been changed</h2>\n\n<p>This is a confirmation that the password for your account {{ .Email }} has just been changed.</p>\n<p>If you did not make this change, please contact support.</p>",
      "mailer_notifications_email_changed_enabled": true,
      "mailer_subjects_email_changed_notification": "Your email address has been changed",
      "mailer_templates_email_changed_notification_content": "<h2>Your email address has been changed</h2>\n\n<p>The email address for your account has been changed from {{ .OldEmail }} to {{ .Email }}.</p>\n<p>If you did not make this change, please contact support.</p>",
      "mailer_notifications_phone_changed_enabled": true,
      "mailer_subjects_phone_changed_notification": "Your phone number has been changed",
      "mailer_templates_phone_changed_notification_content": "<h2>Your phone number has been changed</h2>\n\n<p>The phone number for your account {{ .Email }} has been changed from {{ .OldPhone }} to {{ .Phone }}.</p>\n<p>If you did not make this change, please contact support immediately.</p>",
      "mailer_notifications_mfa_factor_enrolled_enabled": true,
      "mailer_subjects_mfa_factor_enrolled_notification": "A new MFA factor has been enrolled",
      "mailer_templates_mfa_factor_enrolled_notification_content": "<h2>A new MFA factor has been enrolled</h2>\n\n<p>A new factor ({{ .FactorType }}) has been enrolled for your account {{ .Email }}.</p>\n<p>If you did not make this change, please contact support immediately.</p>",
      "mailer_notifications_mfa_factor_unenrolled_enabled": true,
      "mailer_subjects_mfa_factor_unenrolled_notification": "An MFA factor has been unenrolled",
      "mailer_templates_mfa_factor_unenrolled_notification_content": "<h2>An MFA factor has been unenrolled</h2>\n\n<p>A factor ({{ .FactorType }}) has been unenrolled for your account {{ .Email }}.</p>\n<p>If you did not make this change, please contact support immediately.</p>",
      "mailer_notifications_identity_linked_enabled": true,
      "mailer_subjects_identity_linked_notification": "A new identity has been linked",
      "mailer_templates_identity_linked_notification_content": "<h2>A new identity has been linked</h2>\n\n<p>A new identity ({{ .Provider }}) has been linked to your account {{ .Email }}.</p>\n<p>If you did not make this change, please contact support immediately.</p>",
      "mailer_notifications_identity_unlinked_enabled": true,
      "mailer_subjects_identity_unlinked_notification": "An identity has been unlinked",
      "mailer_templates_identity_unlinked_notification_content": "<h2>An identity has been unlinked</h2>\n\n<p>An identity ({{ .Provider }}) has been unlinked from your account {{ .Email }}.</p>\n<p>If you did not make this change, please contact support immediately.</p>"
  }'
Mobile deep linking#
For mobile applications, you might need to link or redirect to a specific page within your app. See the Mobile Deep Linking guide to set this up.

Limitations#
Email prefetching#
Certain email providers may have spam detection or other security features that prefetch URL links from incoming emails (e.g. Safe Links in Microsoft Defender for Office 365).
In this scenario, the {{ .ConfirmationURL }} sent will be consumed instantly which leads to a "Token has expired or is invalid" error.
To guard against this there are the options below:

Option 1

Use an email OTP instead by including {{ .Token }} in the email template
Create your own custom email link to redirect the user to a page where they can enter with their email and token to login
<a href="{{ .SiteURL }}/confirm-signup">Confirm your signup</a>
Log them in by verifying the OTP token value with their email e.g. with supabase.auth.verifyOtp show below
const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
Option 2

Create your own custom email link to redirect the user to a page where they can click on a button to confirm the action
<a href="{{ .SiteURL }}/confirm-signup?confirmation_url={{ .ConfirmationURL }}"
  >Confirm your signup</a
>
The button should contain the actual confirmation link which can be obtained from parsing the confirmation_url={{ .ConfirmationURL }} query parameter in the URL.
Email tracking#
If you are using an external email provider that enables "email tracking", the links inside the Supabase email templates will be overwritten and won't perform as expected. We recommend disabling email tracking to ensure email links are not overwritten.

Redirecting the user to a server-side endpoint#
If you intend to use Server-side rendering, you might want the email link to redirect the user to a server-side endpoint to check if they are authenticated before returning the page. However, the default email link will redirect the user after verification to the redirect URL with the session in the query fragments. Since the session is returned in the query fragments by default, you won't be able to access it on the server-side.

You can customize the email link in the email template to redirect the user to a server-side endpoint successfully. For example:

<a
  href="https://api.example.com/v1/authenticate?token_hash={{ .TokenHash }}&type=invite&redirect_to={{ .RedirectTo }}"
  >Accept the invite
</a>
When the user clicks on the link, the request will hit https://api.example.com/v1/authenticate and you can grab the token_hash, type and redirect_to query parameters from the URL. Then, you can call the verifyOtp method to get back an authenticated session before redirecting the user back to the client. Since the verifyOtp method makes a POST request to Supabase Auth to verify the user, the session will be returned in the response body, which can be read by the server. For example:

const { token_hash, type } = Object.fromEntries(new URLSearchParams(window.location.search))
const {
  data: { session },
  error,
} = await supabase.auth.verifyOtp({ token_hash, type: type as EmailOtpType })
// subsequently redirect the user back to the client using the redirect_to param
// ...
Customization#
Supabase Auth makes use of Go Templates. This means it is possible to conditionally render information based on template properties.

Send different email to early access users#
Send a different email to users who signed up via an early access domain (https://www.earlyaccess.trial.com).

{{ if eq .Data.Domain "https://www.example.com" }}
<h1>Welcome to Our Database Service!</h1>
  <p>Dear Developer,</p>
  <p>Welcome to Billy, the scalable developer platform!</p>
  <p>Best Regards,<br>
Billy Team</p>
{{ else if eq .Data.Domain "https://www.earlyaccess.trial.com" }}
<h1>Welcome to Our Database Service!</h1>
  <p>Dear Developer,</p>
  <p>Welcome Billy, the scalable developer platform!</p>
  <p> As an early access member, you have access to select features like Point To Space Restoration.</p>
  <p>Best Regards,<br>
Billy Team</p>
{{ end }}
2)Auth
Configuration
Redirect URLs
Redirect URLs

Set up redirect urls with Supabase Auth.

Overview#
Supabase Auth allows you to control how the user sessions are handled by your application.

When using passwordless sign-ins or third-party providers, the Supabase client library provides a redirectTo parameter to specify where to redirect the user after authentication. The URL in redirectTo should match the Redirect URLs list configuration.

To configure allowed redirect URLs, go to the URL Configuration page. Once you've added necessary URLs, you can use the URL you want the user to be redirected to in the redirectTo parameter.

The Site URL in URL Configuration defines the default redirect URL when no redirectTo is specified in the code. Change this from http://localhost:3000 to your production URL (e.g., https://example.com). This setting is critical for email confirmations and password resets.

When using Sign in with Web3, the message signed by the user in the Web3 wallet application will indicate the URL on which the signature took place. Supabase Auth will reject messages that are signed for URLs that are not on the allowed list.

In local development or self-hosted projects, use the configuration file. See below for more information on configuring SITE_URL when deploying to Vercel or Netlify.

Use wildcards in redirect URLs#
Supabase allows you to specify wildcards when adding redirect URLs to the allow list. You can use wildcard match patterns to support preview URLs from providers like Netlify and Vercel.

Wildcard	Description
*	matches any sequence of non-separator characters
**	matches any sequence of characters
?	matches any single non-separator character
c	matches character c (c != *, **, ?, \, [, {, })
\c	matches character c
[!{ character-range }]	matches any sequence of characters not in the { character-range }. For example, [!a-z] will not match any characters ranging from a-z.
The separator characters in a URL are defined as . and /. Use this tool to test your patterns.

Recommendation
While the "globstar" (**) is useful for local development and preview URLs, we recommend setting the exact redirect URL path for your site URL in production.

Redirect URL examples with wildcards#
Redirect URL	Description
http://localhost:3000/*	matches http://localhost:3000/foo, http://localhost:3000/bar but not http://localhost:3000/foo/bar or http://localhost:3000/foo/ (note the trailing slash)
http://localhost:3000/**	matches http://localhost:3000/foo, http://localhost:3000/bar and http://localhost:3000/foo/bar
http://localhost:3000/?	matches http://localhost:3000/a but not http://localhost:3000/foo
http://localhost:3000/[!a-z]	matches http://localhost:3000/1 but not http://localhost:3000/a
Netlify preview URLs#
For deployments with Netlify, set the SITE_URL to your official site URL. Add the following additional redirect URLs for local development and deployment previews:

http://localhost:3000/**
https://**--my_org.netlify.app/**
Vercel preview URLs#
For deployments with Vercel, set the SITE_URL to your official site URL. Add the following additional redirect URLs for local development and deployment previews:

http://localhost:3000/**
https://*-<team-or-account-slug>.vercel.app/**
Vercel provides an environment variable for the URL of the deployment called NEXT_PUBLIC_VERCEL_URL. See the Vercel docs for more details. You can use this variable to dynamically redirect depending on the environment. You should also set the value of the environment variable called NEXT_PUBLIC_SITE_URL, this should be set to your site URL in production environment to ensure that redirects function correctly.

const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    'http://localhost:3000/'
  // Make sure to include `https://` when not localhost.
  url = url.startsWith('http') ? url : `https://${url}`
  // Make sure to include a trailing `/`.
  url = url.endsWith('/') ? url : `${url}/`
  return url
}
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: getURL(),
  },
})
Email templates when using redirectTo#
When using a redirectTo option, you may need to replace the {{ .SiteURL }} with {{ .RedirectTo }} in your email templates. See the Email Templates guide for more information.

For example, change the following:

<!-- Old -->
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your mail</a>
<!-- New -->
<a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email"
  >Confirm your mail</a
>
Mobile deep linking URIs#
For mobile applications you can use deep linking URIs. For example, for your SITE_URL you can specify something like com.supabase://login-callback/ and for additional redirect URLs something like com.supabase.staging://login-callback/ if needed.

Read more about deep linking and find code examples for different frameworks here.

Error handling#
When authentication fails, the user will still be redirected to the redirect URL provided. However, the error details will be returned as query fragments in the URL. You can parse these query fragments and show a custom error message to the user. For example:

const params = new URLSearchParams(window.location.hash.slice())
if (params.get('error_code').startsWith('4')) {
  // show error message if error is a 4xx error
  window.alert(params.get('error_description'))
}
 3) General configuration

General configuration options for Supabase Auth

This section covers the general configuration options for Supabase Auth. If you are looking for another type of configuration, you may be interested in one of the following sections:

Policies to manage Row Level Security policies for your tables.
Sign In / Providers to configure authentication providers and login methods for your users.
Third Party Auth to use third-party authentication (TPA) systems based on JWTs to access your project.
Sessions to configure settings for user sessions and refresh tokens.
Rate limits to safeguard against bursts of incoming traffic to prevent abuse and maximize stability.
Email Templates to configure what emails your users receive.
Custom SMTP to configure how emails are sent.
Multi-Factor to require users to provide additional verification factors to authenticate.
URL Configuration to configure site URL and redirect URLs for authentication. Read more in the redirect URLs documentation.
Attack Protection to configure security settings to protect your project from attacks.
Auth Hooks (BETA) to use Postgres functions or HTTP endpoints to customize the behavior of Supabase Auth to meet your needs.
Audit Logs (BETA) to track and monitor auth events in your project.
Advanced to configure advanced authentication server settings.
Supabase Auth provides these general configuration options to control user access to your application:

Allow new users to sign up: Users will be able to sign up. If this config is disabled, only existing users can sign in.

Confirm Email: Users will need to confirm their email address before signing in for the first time.

Having Confirm Email disabled assumes that the user's email does not need to be verified in order to login and implicitly confirms the user's email in the database.
This option can be found in the email provider under the provider-specific configuration.
Allow anonymous sign-ins: Allow anonymous users to be created.

Allow manual linking: Allow users to link their accounts manually. 4) User Management

View, delete, and export user information.

You can view your users on the Users page of the Dashboard. You can also view the contents of the Auth schema in the Table Editor.

Accessing user data via API#
For security, the Auth schema is not exposed in the auto-generated API. If you want to access users data via the API, you can create your own user tables in the public schema.

Make sure to protect the table by enabling Row Level Security. Reference the auth.users table to ensure data integrity. Specify on delete cascade in the reference. For example, a public.profiles table might look like this:

create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  first_name text,
  last_name text,
  primary key (id)
);
alter table public.profiles enable row level security;
Only use primary keys as foreign key references for schemas and tables like auth.users which are managed by Supabase. Postgres lets you specify a foreign key reference for columns backed by a unique index (not necessarily primary keys).

Primary keys are guaranteed not to change. Columns, indices, constraints or other database objects managed by Supabase may change at any time and you should be careful when referencing them directly.

To update your public.profiles table every time a user signs up, set up a trigger. If the trigger fails, it could block signups, so test your code thoroughly.

-- inserts a row into public.profiles
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (new.id, new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name');
  return new;
end;
$$;
-- trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
Adding and retrieving user metadata#
You can assign metadata to users on sign up:


JavaScript

Dart

Swift

Kotlin
const { data, error } = await supabase.auth.signUp({
  email: 'valid.email@supabase.io',
  password: 'example-password',
  options: {
    data: {
      first_name: 'John',
      age: 27,
    },
  },
})
User metadata is stored on the raw_user_meta_data column of the auth.users table. To view the metadata:


JavaScript

Dart

Swift

Kotlin
const {
  data: { user },
} = await supabase.auth.getUser()
let metadata = user?.user_metadata
Deleting users#
You may delete users directly or via the management console at Authentication > Users. Note that deleting a user from the auth.users table does not automatically sign out a user. As Supabase makes use of JSON Web Tokens (JWT), a user's JWT will remain "valid" until it has expired.

You cannot delete a user if they are the owner of any objects in Supabase Storage.

You will encounter an error when you try to delete an Auth user that owns any Storage objects. If this happens, try deleting all the objects for that user, or reassign ownership to another user.

Exporting users#
As Supabase is built on top of Postgres, you can query the auth.users and auth.identities table via the SQL Editor tab to extract all users:

select * from auth.users;
You can then export the results as CSV.

5)Before User Created Hook

Prevent unwanted signups by inspecting and rejecting user creation requests

This hook runs before a new user is created. It allows developers to inspect the incoming user object and optionally reject the request. Use this to enforce custom signup policies that Supabase Auth does not handle natively - such as blocking disposable email domains, restricting access by region or IP, or requiring that users belong to a specific email domain.

You can implement this hook using an HTTP endpoint or a Postgres function. If the hook returns an error object, the signup is denied and the user is not created. If the hook responds successfully (HTTP 200 or 204 with no error), the request proceeds as usual. This gives you full control over which users are allowed to register — and the flexibility to apply that logic server-side.

Inputs#
Supabase Auth will send a payload containing these fields to your hook:

Field	Type	Description
metadata	object	Metadata about the request. Includes IP address, request ID, and hook type.
user	object	The user record that is about to be created. Matches the shape of the auth.users table.
Because the hook is ran just before the insertion into the database, this user will not be found in Postgres at the time the hook is called.


JSON

JSON Schema
{
  "metadata": {
    "uuid": "8b34dcdd-9df1-4c10-850a-b3277c653040",
    "time": "2025-04-29T13:13:24.755552-07:00",
    "name": "before-user-created",
    "ip_address": "127.0.0.1"
  },
  "user": {
    "id": "ff7fc9ae-3b1b-4642-9241-64adb9848a03",
    "aud": "authenticated",
    "role": "",
    "email": "valid.email@supabase.com",
    "phone": "",
    "app_metadata": {
      "provider": "email",
      "providers": ["email"]
    },
    "user_metadata": {},
    "identities": [],
    "created_at": "0001-01-01T00:00:00Z",
    "updated_at": "0001-01-01T00:00:00Z",
    "is_anonymous": false
  }
}
Outputs#
Your hook must return a response that either allows or blocks the signup request.

Field	Type	Description
error	object	(Optional) Return this to reject the signup. Includes a code, message, and optional HTTP status code.
Returning an empty object with a 200 or 204 status code allows the request to proceed. Returning a JSON response with an error object and a 4xx status code blocks the request and propagates the error message to the client. See the error handling documentation for more details.

Allow the signup#
{}
or with a 204 No Content response:

HTTP/1.1 204 No Content
Reject the signup with an error#
{
  "error": {
    "http_code": 400,
    "message": "Only company emails are allowed to sign up."
  }
}
This response will block the user creation and return the error message to the client that attempted signup.

Examples#
Each of the following examples shows how to use the before-user-created hook to control signup behavior. Each use case includes both a HTTP implementation (e.g. using an Edge Function) and a SQL implementation (Postgres function).


SQL

HTTP

Allow by Domain

Block by OAuth Provider

Allow/Deny by IP or CIDR
Allow signups only from specific domains like supabase.com or example.test. Reject all others. This is useful for private/internal apps, enterprise gating, or invite-only beta access.

The before-user-created hook solves this by:

Detecting that a user is about to be created
Providing the email address in the user.email field
Run the following snippet in your project's SQL Editor. This will create a signup_email_domains table with some sample data and a hook_restrict_signup_by_email_domain function to be called by the before-user-created auth hook.

-- Create ENUM type for domain rule classification
do $$ begin
  create type signup_email_domain_type as enum ('allow', 'deny');
exception
  when duplicate_object then null;
end $$;
-- Create the signup_email_domains table
create table if not exists public.signup_email_domains (
  id serial primary key,
  domain text not null,
  type signup_email_domain_type not null,
  reason text default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Create a trigger to maintain updated_at
create or replace function update_signup_email_domains_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
drop trigger if exists trg_signup_email_domains_set_updated_at on public.signup_email_domains;
create trigger trg_signup_email_domains_set_updated_at
before update on public.signup_email_domains
for each row
execute procedure update_signup_email_domains_updated_at();
-- Seed example data
insert into public.signup_email_domains (domain, type, reason) values
  ('supabase.com', 'allow', 'Internal signups'),
  ('gmail.com', 'deny', 'Public email provider'),
  ('yahoo.com', 'deny', 'Public email provider');
-- Create the function
create or replace function public.hook_restrict_signup_by_email_domain(event jsonb)
returns jsonb
language plpgsql
as $$
declare
  email text;
  domain text;
  is_allowed int;
  is_denied int;
begin
  email := event->'user'->>'email';
  domain := split_part(email, '@', 2);
  -- Check for allow match
  select count(*) into is_allowed
  from public.signup_email_domains
  where type = 'allow' and lower(domain) = lower($1);
  if is_allowed > 0 then
    return '{}'::jsonb;
  end if;
  -- Check for deny match
  select count(*) into is_denied
  from public.signup_email_domains
  where type = 'deny' and lower(domain) = lower($1);
  if is_denied > 0 then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'message', 'Signups from this email domain are not allowed.',
        'http_code', 403
      )
    );
  end if;
  -- No match, allow by default
  return '{}'::jsonb;
end;
$$;
-- Permissions
grant execute
  on function public.hook_restrict_signup_by_email_domain
  to supabase_auth_admin;
revoke execute
  on function public.hook_restrict_signup_by_email_domain
  from authenticated, anon, public;

 6) Passwordless email logins

Email logins using Magic Links or One-Time Passwords (OTPs)

Supabase Auth provides several passwordless login methods. Passwordless logins allow users to sign in without a password, by clicking a confirmation link or entering a verification code.

Passwordless login can:

Improve the user experience by not requiring users to create and remember a password
Increase security by reducing the risk of password-related security breaches
Reduce support burden of dealing with password resets and other password-related flows
Supabase Auth offers two passwordless login methods that use the user's email address:

Magic Link
OTP
With Magic Link#
Magic Links are a form of passwordless login where users click on a link sent to their email address to log in to their accounts. Magic Links only work with email addresses and are one-time use only.

Enabling Magic Link#
Email authentication methods, including Magic Links, are enabled by default.

Configure the Site URL and any additional redirect URLs. These are the only URLs that are allowed as redirect destinations after the user clicks a Magic Link. You can change the URLs on the URL Configuration page for hosted projects, or in the configuration file for self-hosted projects.

By default, a user can only request a magic link once every 60 seconds and they expire after 1 hour.

Signing in with Magic Link#
Call the "sign in with OTP" method from the client library.

Though the method is labelled "OTP", it sends a Magic Link by default. The two methods differ only in the content of the confirmation email sent to the user.

If the user hasn't signed up yet, they are automatically signed up by default. To prevent this, set the shouldCreateUser option to false.


JavaScript

Expo React Native

Dart

Swift

Kotlin

Python
async function signInWithEmail() {
  const { data, error } = await supabase.auth.signInWithOtp({
    email: 'valid.email@supabase.io',
    options: {
      // set this to false if you do not want the user to be automatically signed up
      shouldCreateUser: false,
      emailRedirectTo: 'https://example.com/welcome',
    },
  })
}
That's it for the implicit flow.

If you're using PKCE flow, edit the Magic Link email template to send a token hash:

<h2>Magic Link</h2>
<p>Follow this link to login:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Log In</a></p>
At the /auth/confirm endpoint, exchange the hash for the session:

const { error } = await supabase.auth.verifyOtp({
  token_hash: 'hash',
  type: 'email',
})
With OTP#
Email one-time passwords (OTP) are a form of passwordless login where users key in a six digit code sent to their email address to log in to their accounts.

Enabling email OTP#
Email authentication methods, including Email OTPs, are enabled by default.

Email OTPs share an implementation with Magic Links. To send an OTP instead of a Magic Link, alter the Magic Link email template. For a hosted Supabase project, go to Email Templates in the Dashboard. For a self-hosted project or local development, see the Email Templates guide.

Modify the template to include the {{ .Token }} variable, for example:

<h2>One time login code</h2>
<p>Please enter this code: {{ .Token }}</p>
By default, a user can only request an OTP once every 60 seconds and they expire after 1 hour. This is configurable via Auth > Providers > Email > Email OTP Expiration. An expiry duration of more than 86400 seconds (one day) is disallowed to guard against brute force attacks. The longer an OTP remains valid, the more time an attacker has to attempt brute force attacks. If the OTP is valid for several days, an attacker might have more opportunities to guess the correct OTP through repeated attempts.

Signing in with email OTP#
Step 1: Send the user an OTP code#
Get the user's email and call the "sign in with OTP" method from your client library.

If the user hasn't signed up yet, they are automatically signed up by default. To prevent this, set the shouldCreateUser option to false.


JavaScript

Dart

Swift

Kotlin

Python
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'valid.email@supabase.io',
  options: {
    // set this to false if you do not want the user to be automatically signed up
    shouldCreateUser: false,
  },
})
If the request is successful, you receive a response with error: null and a data object where both user and session are null. Let the user know to check their email inbox.

{
  "data": {
    "user": null,
    "session": null
  },
  "error": null
}
Step 2: Verify the OTP to create a session#
Provide an input field for the user to enter their one-time code.

Call the "verify OTP" method from your client library with the user's email address, the code, and a type of email:


JavaScript

Swift

Kotlin

Python
const {
  data: { session },
  error,
} = await supabase.auth.verifyOtp({
  email: 'email@example.com',
  token: '123456',
  type: 'email',
})
If successful, the user is now logged in, and you receive a valid session that looks like:

{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNjI3MjkxNTc3LCJzdWIiOiJmYTA2NTQ1Zi1kYmI1LTQxY2EtYjk1NC1kOGUyOTg4YzcxOTEiLCJlbWFpbCI6IiIsInBob25lIjoiNjU4NzUyMjAyOSIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6InBob25lIn0sInVzZXJfbWV0YWRhdGEiOnt9LCJyb2xlIjoiYXV0aGVudGljYXRlZCJ9.1BqRi0NbS_yr1f6hnr4q3s1ylMR3c1vkiJ4e_N55dhM",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "LSp8LglPPvf0DxGMSj-vaQ",
  "user": {...}
} 7- Signing out

Signing out a user

Signing out a user works the same way no matter what method they used to sign in.

Call the sign out method from the client library. It removes the active session and clears Auth data from the storage medium.


JavaScript

Dart

Swift

Kotlin

Python
async function signOut() {
  const { error } = await supabase.auth.signOut()
}
Sign out and scopes#
Supabase Auth allows you to specify three different scopes for when a user invokes the sign out API in your application:

global (default) when all sessions active for the user are terminated.
local which only terminates the current session for the user but keep sessions on other devices or browsers active.
others to terminate all but the current session for the user.
You can invoke these by providing the scope option:


JavaScript

Dart

Kotlin
// defaults to the global scope
await supabase.auth.signOut()
// sign out from the current session only
await supabase.auth.signOut({ scope: 'local' })
Upon sign out, all refresh tokens and potentially other database objects related to the affected sessions are destroyed and the client library removes the session stored in the local storage medium.

Access Tokens of revoked sessions remain valid until their expiry time, encoded in the exp claim. The user won't be immediately logged out and will only be logged out when the Access Token expires.

8)With OTP#
Email one-time passwords (OTP) are a form of passwordless login where users key in a six digit code sent to their email address to log in to their accounts.

Enabling email OTP#
Email authentication methods, including Email OTPs, are enabled by default.

Email OTPs share an implementation with Magic Links. To send an OTP instead of a Magic Link, alter the Magic Link email template. For a hosted Supabase project, go to Email Templates in the Dashboard. For a self-hosted project or local development, see the Email Templates guide.

Modify the template to include the {{ .Token }} variable, for example:

<h2>One time login code</h2>
<p>Please enter this code: {{ .Token }}</p>
By default, a user can only request an OTP once every 60 seconds and they expire after 1 hour. This is configurable via Auth > Providers > Email > Email OTP Expiration. An expiry duration of more than 86400 seconds (one day) is disallowed to guard against brute force attacks. The longer an OTP remains valid, the more time an attacker has to attempt brute force attacks. If the OTP is valid for several days, an attacker might have more opportunities to guess the correct OTP through repeated attempts.

Signing in with email OTP#
Step 1: Send the user an OTP code#
Get the user's email and call the "sign in with OTP" method from your client library.

If the user hasn't signed up yet, they are automatically signed up by default. To prevent this, set the shouldCreateUser option to false.


JavaScript

Dart

Swift

Kotlin

Python
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'valid.email@supabase.io',
  options: {
    // set this to false if you do not want the user to be automatically signed up
    shouldCreateUser: false,
  },
})
If the request is successful, you receive a response with error: null and a data object where both user and session are null. Let the user know to check their email inbox.

{
  "data": {
    "user": null,
    "session": null
  },
  "error": null
}
Step 2: Verify the OTP to create a session#
Provide an input field for the user to enter their one-time code.

Call the "verify OTP" method from your client library with the user's email address, the code, and a type of email:


JavaScript

Swift

Kotlin

Python
const {
  data: { session },
  error,
} = await supabase.auth.verifyOtp({
  email: 'email@example.com',
  token: '123456',
  type: 'email',
})
If successful, the user is now logged in, and you receive a valid session that looks like:

{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNjI3MjkxNTc3LCJzdWIiOiJmYTA2NTQ1Zi1kYmI1LTQxY2EtYjk1NC1kOGUyOTg4YzcxOTEiLCJlbWFpbCI6IiIsInBob25lIjoiNjU4NzUyMjAyOSIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6InBob25lIn0sInVzZXJfbWV0YWRhdGEiOnt9LCJyb2xlIjoiYXV0aGVudGljYXRlZCJ9.1BqRi0NbS_yr1f6hnr4q3s1ylMR3c1vkiJ4e_N55dhM",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "LSp8LglPPvf0DxGMSj-vaQ",
  "user": {...}
}
