import type { AuthProfile } from "@specdock/core";

type UpdateProfile = (
  profileId: string,
  patch: Partial<Pick<AuthProfile, "name" | "values">>
) => void;

export const AuthProfileFields = ({
  profile,
  onUpdateProfile
}: {
  profile: AuthProfile;
  onUpdateProfile: UpdateProfile;
}) => {
  const updateValue = (name: string, value: string) =>
    onUpdateProfile(profile.id, { values: { [name]: value } });

  if (profile.type === "bearer") {
    return (
      <SecretField
        label="Token"
        value={profile.values.token ?? ""}
        onChange={(value) => updateValue("token", value)}
      />
    );
  }

  if (profile.type === "basic") {
    return (
      <div className="auth-profile-fields">
        <LabeledField
          label="Username"
          value={profile.values.username ?? ""}
          onChange={(value) => updateValue("username", value)}
        />
        <SecretField
          label="Password"
          value={profile.values.password ?? ""}
          onChange={(value) => updateValue("password", value)}
        />
      </div>
    );
  }

  if (profile.type === "cookieCsrf") {
    return (
      <div className="auth-profile-fields auth-profile-fields-session">
        <SecretField
          label="Cookie"
          value={profile.values.cookie ?? ""}
          onChange={(value) => updateValue("cookie", value)}
        />
        <LabeledField
          label="CSRF field"
          value={profile.values.csrfFieldName ?? "csrf_token"}
          onChange={(value) => updateValue("csrfFieldName", value)}
        />
        <SecretField
          label="CSRF token"
          value={profile.values.csrfToken ?? ""}
          onChange={(value) => updateValue("csrfToken", value)}
        />
        <LabeledField
          label="Origin"
          value={profile.values.origin ?? ""}
          onChange={(value) => updateValue("origin", value)}
        />
        <LabeledField
          label="Referer"
          value={profile.values.referer ?? ""}
          onChange={(value) => updateValue("referer", value)}
        />
      </div>
    );
  }

  return (
    <div className="auth-profile-fields auth-profile-fields-three">
      <label className="block">
        <span className="field-label">Placement</span>
        <select
          className="field w-full"
          value={profile.values.placement === "query" ? "query" : "header"}
          onChange={(event) => updateValue("placement", event.target.value)}
        >
          <option value="header">Header</option>
          <option value="query">Query</option>
        </select>
      </label>
      <LabeledField
        label="Name"
        value={profile.values.name ?? ""}
        onChange={(value) => updateValue("name", value)}
      />
      <SecretField
        label="Value"
        value={profile.values.value ?? ""}
        onChange={(value) => updateValue("value", value)}
      />
    </div>
  );
};

export const profileLabel = (type: AuthProfile["type"]): string => {
  if (type === "bearer") return "Bearer";
  if (type === "apiKey") return "API key";
  if (type === "basic") return "Basic";
  if (type === "cookieCsrf") return "Cookie + CSRF";

  return "None";
};

const LabeledField = ({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange(value: string): void;
}) => (
  <label className="block">
    <span className="field-label">{label}</span>
    <input
      className="field w-full"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
);

const SecretField = ({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange(value: string): void;
}) => (
  <label className="block">
    <span className="field-label">{label}</span>
    <input
      className="field w-full"
      type="password"
      autoComplete="off"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
);
