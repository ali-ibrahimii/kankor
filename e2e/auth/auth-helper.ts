import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Resolve environment variables from the root .env file
const envPath = path.resolve(__dirname, "../../.env");

function loadEnv() {
	if (fs.existsSync(envPath)) {
		const content = fs.readFileSync(envPath, "utf8");
		const lines = content.split("\n");
		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith("#")) continue;
			const match = trimmed.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
			if (match) {
				const key = match[1];
				let val = match[2] || "";
				if (val.startsWith('"') && val.endsWith('"')) {
					val = val.slice(1, -1);
				} else if (val.startsWith("'") && val.endsWith("'")) {
					val = val.slice(1, -1);
				}
				process.env[key] = val;
			}
		}
	}
}

loadEnv();

const supabaseUrl =
	process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
	throw new Error(`SUPABASE_SERVICE_ROLE_KEY is not defined in ${envPath}`);
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});

/**
 * Clears any users from the auth schema whose emails start with 'test-playwright-'
 */
export async function cleanUpPlaywrightUsers() {
	const { data, error } = await supabaseAdmin.auth.admin.listUsers();
	if (error) {
		console.error("Error listing users for cleanup:", error);
		return;
	}

	const testUsers = data.users.filter((u) =>
		u.email?.toLowerCase().includes("test-playwright-")
	);
	for (const user of testUsers) {
		const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
			user.id
		);
		if (deleteError) {
			console.error(`Error deleting test user ${user.email}:`, deleteError);
		} else {
			console.log(`Successfully deleted test user ${user.email}`);
		}
	}
}

/**
 * Deletes a single user by their email address.
 */
export async function deleteUserByEmail(email: string) {
	const { data, error } = await supabaseAdmin.auth.admin.listUsers();
	if (error) {
		console.error(`Error listing users to delete ${email}:`, error);
		return;
	}
	const targetUser = data.users.find(
		(u) => u.email?.toLowerCase() === email.toLowerCase()
	);
	if (targetUser) {
		const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
			targetUser.id
		);
		if (deleteError) {
			console.error(`Error deleting user ${email}:`, deleteError);
		} else {
			console.log(`Successfully cleaned up user: ${email}`);
		}
	}
}

/**
 * Deletes all messages in Mailpit to start fresh.
 */
export async function clearMailpit() {
	try {
		const res = await fetch("http://127.0.0.1:54324/api/v1/messages", {
			method: "DELETE",
		});
		if (!res.ok) {
			console.error("Failed to clear Mailpit:", res.statusText);
		}
	} catch (err) {
		console.error("Error connecting to Mailpit to clear messages:", err);
	}
}

/**
 * Searches Mailpit for the latest email to the given recipient,
 * parses its body, and extracts the link containing confirmation token.
 */
export async function getLatestEmailLink(
	recipient: string,
	linkMatcher: (link: string) => boolean = (l) =>
		l.includes("verify") || l.includes("callback") || l.includes("token_hash")
): Promise<string> {
	const mailpitUrl = "http://127.0.0.1:54324";

	// Poll for up to 10 seconds (10 attempts, 1s apart)
	for (let attempt = 0; attempt < 10; attempt++) {
		try {
			const res = await fetch(`${mailpitUrl}/api/v1/messages`);
			if (!res.ok) {
				throw new Error(`Mailpit list messages error: ${res.statusText}`);
			}

			const data = (await res.json()) as any;
			const messages = data.messages || [];

			// Find messages sent to our recipient (case insensitive match)
			const matches = messages.filter(
				(m: any) =>
					m.To &&
					m.To.some(
						(to: any) => to.Address.toLowerCase() === recipient.toLowerCase()
					)
			);

			if (matches.length > 0) {
				// Retrieve details for the newest matching message
				const newest = matches[0];
				const detailRes = await fetch(
					`${mailpitUrl}/api/v1/message/${newest.ID}`
				);
				if (!detailRes.ok) {
					throw new Error(
						`Mailpit message details error: ${detailRes.statusText}`
					);
				}

				const details = (await detailRes.json()) as any;
				const html = details.HTML || "";
				const text = details.Text || "";
				const body = html || text;

				// Match all links: href="..." or simple URL patterns
				const hrefRegex = /href="([^"]+)"/g;
				let match;
				const links: string[] = [];

				while ((match = hrefRegex.exec(body)) !== null) {
					links.push(match[1]);
				}

				// Check text links as fallback
				const urlRegex = /(https?:\/\/[^\s"'<>]+)/g;
				let urlMatch;
				while ((urlMatch = urlRegex.exec(body)) !== null) {
					links.push(urlMatch[1]);
				}

				// HTML entity decode for common entities (like &amp;)
				const decodedLinks = links.map((l) => l.replace(/&amp;/g, "&"));

				const targetLink = decodedLinks.find(linkMatcher);
				if (targetLink) {
					return targetLink;
				}
			}
		} catch (err) {
			console.warn(`Polling Mailpit attempt ${attempt + 1} failed:`, err);
		}

		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	throw new Error(
		`Verification email to ${recipient} was not received or target link was not found.`
	);
}
