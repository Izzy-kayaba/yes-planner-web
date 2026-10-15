// Purpose: explains the platform staff permission policy to authorised staff.
import { platformPermissions, platformPermissionsByRole } from "@/lib/auth/platform-permissions";
import { platformStaffRoles } from "@/lib/auth/roles";
import { getTextTranslator } from "@/lib/i18n-server";

export async function PlatformPermissionMatrix() {
  const text = await getTextTranslator();
  return (
    <article className="panel overflow-x-auto">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{text("Platform")}</p>
          <h2>{text("Roles and permissions")}</h2>
        </div>
      </div>
      <p className="mb-4 text-sm text-yes-muted">
        {text(
          "This table is the current platform access policy. A role only receives the permissions listed for it here.",
        )}
      </p>
      <table className="w-full min-w-[1280px] text-left text-sm">
        <thead>
          <tr className="border-b border-yes-line">
            <th className="px-3 py-3 font-semibold">{text("Role")}</th>
            {platformPermissions.map((permission) => (
              <th className="max-w-24 px-3 py-3 text-center font-semibold" key={permission}>
                <span className="block -rotate-45 whitespace-nowrap text-xs">{permission}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {platformStaffRoles.map((role) => (
            <tr className="border-b border-yes-line last:border-0" key={role}>
              <th className="px-3 py-3 align-top font-semibold">{role}</th>
              {platformPermissions.map((permission) => {
                const enabled = platformPermissionsByRole[role].includes(permission);
                return (
                  <td
                    aria-label={`${role} ${permission}: ${enabled ? "allowed" : "not allowed"}`}
                    className="px-3 py-3 text-center"
                    key={`${role}-${permission}`}
                  >
                    <span
                      aria-hidden="true"
                      className={enabled ? "text-yes-sage" : "text-yes-muted"}
                    >
                      {enabled ? "✓" : "×"}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
