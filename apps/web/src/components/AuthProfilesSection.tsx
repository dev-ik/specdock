import { KeyRound, Plus, ShieldCheck, Trash2 } from "lucide-react";
import type { AuthProfile } from "@specdock/core";
import { AuthProfileFields, profileLabel } from "./AuthProfileFields.js";

export const AuthProfilesSection = ({
  projectId,
  profiles,
  onAddProfile,
  onUpdateProfile,
  onDeleteProfile
}: {
  projectId?: string;
  profiles: AuthProfile[];
  onAddProfile(type: AuthProfile["type"]): void;
  onUpdateProfile(
    profileId: string,
    patch: Partial<Pick<AuthProfile, "name" | "values">>
  ): void;
  onDeleteProfile(profileId: string): void;
}) => (
  <section className="settings-section">
    <div className="settings-section-header">
      <div>
        <h3>Auth profiles</h3>
        <p>Local project credentials. Exports redact secret values.</p>
      </div>
      <ShieldCheck size={18} aria-hidden="true" />
    </div>

    <div className="button-row auth-profile-actions">
      <button
        className="button button-small button-secondary"
        type="button"
        disabled={!projectId}
        onClick={() => onAddProfile("bearer")}
      >
        <Plus size={14} aria-hidden="true" />
        Bearer
      </button>
      <button
        className="button button-small button-secondary"
        type="button"
        disabled={!projectId}
        onClick={() => onAddProfile("apiKey")}
      >
        <Plus size={14} aria-hidden="true" />
        API key
      </button>
      <button
        className="button button-small button-secondary"
        type="button"
        disabled={!projectId}
        onClick={() => onAddProfile("basic")}
      >
        <Plus size={14} aria-hidden="true" />
        Basic
      </button>
      <button
        className="button button-small button-secondary"
        type="button"
        disabled={!projectId}
        onClick={() => onAddProfile("cookieCsrf")}
      >
        <Plus size={14} aria-hidden="true" />
        Cookie + CSRF
      </button>
    </div>

    {!projectId ? (
      <div className="empty-field">Import a spec to create auth profiles</div>
    ) : profiles.length === 0 ? (
      <div className="empty-field">No auth profiles for this project</div>
    ) : (
      <div className="auth-profile-list">
        {profiles.map((profile) => (
          <AuthProfileCard
            key={profile.id}
            profile={profile}
            onUpdateProfile={onUpdateProfile}
            onDeleteProfile={onDeleteProfile}
          />
        ))}
      </div>
    )}
  </section>
);

const AuthProfileCard = ({
  profile,
  onUpdateProfile,
  onDeleteProfile
}: {
  profile: AuthProfile;
  onUpdateProfile(
    profileId: string,
    patch: Partial<Pick<AuthProfile, "name" | "values">>
  ): void;
  onDeleteProfile(profileId: string): void;
}) => (
  <article className="auth-profile-card">
    <div className="auth-profile-card-header">
      <KeyRound size={16} aria-hidden="true" />
      <input
        className="field"
        aria-label={`${profileLabel(profile.type)} profile name`}
        value={profile.name}
        onChange={(event) =>
          onUpdateProfile(profile.id, { name: event.target.value })
        }
      />
      <span className="auth-profile-type">{profileLabel(profile.type)}</span>
      <button
        className="field-remove-button"
        type="button"
        aria-label={`Delete ${profile.name}`}
        title={`Delete ${profile.name}`}
        onClick={() => onDeleteProfile(profile.id)}
      >
        <Trash2 size={15} aria-hidden="true" />
      </button>
    </div>
    <AuthProfileFields
      profile={profile}
      onUpdateProfile={onUpdateProfile}
    />
  </article>
);
