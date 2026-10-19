import { NextResponse } from "next/server";

export async function GET() {
	return NextResponse.json([
		{
			relation: [
				"delegate_permission/common.handle_all_urls",
				"delegate_permission/common.get_login_creds",
			],
			target: {
				namespace: "android_app",
				package_name: "com.abzarkankor.abzarkankor2",
				sha256_cert_fingerprints: [
					"DE:18:A1:B3:2E:AA:D5:69:25:D9:E3:9A:11:43:FD:5B:E6:70:A6:E9:78:CA:0B:BC:6E:96:B2:27:AD:FB:C2:D5",
				],
			},
		},
	]);
}
