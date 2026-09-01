import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AdminPayload {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  admin_role?: "super_admin" | "admin" | "manager";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonError(401, "Missing authorization header");
    }

    // Create a client with the caller's JWT to verify they are a super admin
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return jsonError(401, "Invalid session");
    }

    const callerId = userData.user.id;

    // Check caller is a super admin
    const { data: callerProfile, error: profileError } = await userClient
      .from("profiles")
      .select("admin_role")
      .eq("id", callerId)
      .maybeSingle();

    if (profileError || !callerProfile || callerProfile.admin_role !== "super_admin") {
      return jsonError(403, "Only Super Admins can manage administrator accounts");
    }

    // Service-role client for privileged operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const url = new URL(req.url);
    const method = req.method;

    // POST: Create a new admin user
    if (method === "POST") {
      const body = await req.json() as AdminPayload;
      if (!body.email || !body.password) {
        return jsonError(400, "Email and password are required");
      }
      const role = body.admin_role || "admin";
      if (!["super_admin", "admin", "manager"].includes(role)) {
        return jsonError(400, "Invalid admin role");
      }

      // Create the auth user
      const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: { full_name: body.full_name || "" },
      });

      if (createError) {
        return jsonError(400, createError.message);
      }

      const newUserId = authData.user.id;

      // Update the profile with admin role and details
      const { error: updateError } = await adminClient
        .from("profiles")
        .update({
          admin_role: role,
          full_name: body.full_name || null,
          phone: body.phone || null,
        })
        .eq("id", newUserId);

      if (updateError) {
        // Best-effort cleanup: delete the auth user if profile update failed
        await adminClient.auth.admin.deleteUser(newUserId);
        return jsonError(500, "Failed to set admin role: " + updateError.message);
      }

      return jsonResponse(201, {
        id: newUserId,
        email: body.email,
        admin_role: role,
        full_name: body.full_name || null,
      });
    }

    // PUT: Update an existing admin (role, active status, details)
    if (method === "PUT") {
      const body = await req.json() as {
        id: string;
        admin_role?: "super_admin" | "admin" | "manager" | null;
        full_name?: string;
        phone?: string;
        active?: boolean;
      };

      if (!body.id) {
        return jsonError(400, "User ID is required");
      }

      // Prevent self-demotion
      if (body.id === callerId && body.admin_role !== "super_admin") {
        return jsonError(400, "You cannot demote your own super admin role");
      }

      const updates: Record<string, unknown> = {};
      if (body.admin_role !== undefined) {
        if (body.admin_role !== null && !["super_admin", "admin", "manager"].includes(body.admin_role)) {
          return jsonError(400, "Invalid admin role");
        }
        updates.admin_role = body.admin_role;
      }
      if (body.full_name !== undefined) updates.full_name = body.full_name || null;
      if (body.phone !== undefined) updates.phone = body.phone || null;

      if (Object.keys(updates).length === 0) {
        return jsonError(400, "No fields to update");
      }

      const { error: updateError } = await adminClient
        .from("profiles")
        .update(updates)
        .eq("id", body.id);

      if (updateError) {
        return jsonError(500, updateError.message);
      }

      // If deactivating (removing admin role), optionally ban the auth user
      if (body.admin_role === null) {
        await adminClient.auth.admin.updateUserById(body.id, { ban_duration: "876000h" });
      } else if (body.active === true) {
        await adminClient.auth.admin.updateUserById(body.id, { ban_duration: "none" });
      }

      return jsonResponse(200, { id: body.id, ...updates });
    }

    // DELETE: Remove an admin (revoke admin access, optionally delete account)
    if (method === "DELETE") {
      const id = url.searchParams.get("id");
      if (!id) {
        return jsonError(400, "User ID is required");
      }
      if (id === callerId) {
        return jsonError(400, "You cannot delete your own account");
      }

      // Revoke admin role first
      const { error: revokeError } = await adminClient
        .from("profiles")
        .update({ admin_role: null })
        .eq("id", id);

      if (revokeError) {
        return jsonError(500, revokeError.message);
      }

      // Ban the auth user so they can no longer sign in
      await adminClient.auth.admin.updateUserById(id, { ban_duration: "876000h" });

      return jsonResponse(200, { id, revoked: true });
    }

    return jsonError(405, "Method not allowed");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return jsonError(500, msg);
  }
});

function jsonResponse(status: number, data: unknown) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
