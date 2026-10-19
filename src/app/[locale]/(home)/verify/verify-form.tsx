"use client";

import { CameraIcon, Loader2Icon, QrCodeIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Dropzone } from "@/components/ui/dropzone";
import { Field, FieldGroup, FieldSeparator } from "@/components/ui/field";
import { useAppForm } from "@/hooks/use-form";
import { useRouter } from "@/i18n/navigation";
import { routes } from "@/lib/routes";

async function decodeQrFromFile(file: File): Promise<string | null> {
	try {
		const jsQR = (await import("jsqr")).default;
		const bitmap = await createImageBitmap(file);
		const canvas = document.createElement("canvas");
		canvas.width = bitmap.width;
		canvas.height = bitmap.height;
		const ctx = canvas.getContext("2d");
		if (!ctx) return null;
		ctx.drawImage(bitmap, 0, 0);
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const result = jsQR(imageData.data, imageData.width, imageData.height);
		return result?.data ?? null;
	} catch {
		return null;
	}
}

export function VerifyForm() {
	const t = useTranslations("certificates.verify");
	const router = useRouter();
	const [isScanning, setIsScanning] = useState(false);

	// Live Camera Scanner State
	const [isCameraSupported, setIsCameraSupported] = useState(false);
	const [isCameraOpen, setIsCameraOpen] = useState(false);
	const [isCameraLoading, setIsCameraLoading] = useState(false);
	const [stream, setStream] = useState<MediaStream | null>(null);

	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		setIsCameraSupported(
			typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia
		);
	}, []);

	// Stop camera tracks whenever stream changes or component unmounts
	useEffect(() => {
		return () => {
			if (stream) {
				stream.getTracks().forEach((track) => track.stop());
			}
		};
	}, [stream]);

	const form = useAppForm({
		defaultValues: {
			code: "",
		},
		onSubmit: async ({ value }) => {
			if (value.code) {
				router.push(routes.verify.code.page({ code: value.code.trim() }));
			}
		},
	});

	async function handleFilesSelected(files: File[]) {
		const file = files[0];
		if (!file) return;

		setIsScanning(true);
		try {
			const decoded = await decodeQrFromFile(file);
			if (decoded) {
				let code = decoded.trim();

				// Try to extract code from URL
				if (code.startsWith("http://") || code.startsWith("https://")) {
					try {
						const url = new URL(code);
						const parts = url.pathname.split("/").filter(Boolean);
						const verifyIndex = parts.indexOf("verify");
						if (verifyIndex !== -1 && parts[verifyIndex + 1]) {
							code = parts[verifyIndex + 1];
						} else {
							code = parts[parts.length - 1] || code;
						}
					} catch {
						// Fallback to decoded value as is
					}
				}

				if (code) {
					toast.success(t("scanQrSuccess"));
					router.push(routes.verify.code.page({ code }));
				} else {
					toast.error(t("scanQrError"));
				}
			} else {
				toast.error(t("scanQrError"));
			}
		} catch {
			toast.error(t("scanQrError"));
		} finally {
			setIsScanning(false);
		}
	}

	async function startCamera() {
		setIsCameraOpen(true);
		setIsCameraLoading(true);
		try {
			const mediaStream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: "environment" },
			});
			setStream(mediaStream);
			if (videoRef.current) {
				videoRef.current.srcObject = mediaStream;
				videoRef.current.setAttribute("playsinline", "true");
				await videoRef.current.play();
			}
			setIsCameraLoading(false);
		} catch (err) {
			console.error("Camera access failed:", err);
			toast.error(t("cameraPermissionError"));
			setIsCameraOpen(false);
			setIsCameraLoading(false);
		}
	}

	function stopCamera() {
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
			setStream(null);
		}
		setIsCameraOpen(false);
	}

	// Scanner animation loop
	useEffect(() => {
		if (!isCameraOpen || !stream) return;

		let active = true;
		let animationFrameId: number;

		async function runLoop() {
			try {
				const jsQR = (await import("jsqr")).default;

				const tick = () => {
					if (!active) return;
					const video = videoRef.current;
					const canvas = canvasRef.current;

					if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
						const ctx = canvas.getContext("2d");
						if (ctx) {
							canvas.width = video.videoWidth;
							canvas.height = video.videoHeight;
							ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
							const imageData = ctx.getImageData(
								0,
								0,
								canvas.width,
								canvas.height
							);
							const decodedResult = jsQR(
								imageData.data,
								imageData.width,
								imageData.height
							);

							if (decodedResult?.data) {
								let code = decodedResult.data.trim();
								if (code.startsWith("http://") || code.startsWith("https://")) {
									try {
										const url = new URL(code);
										const parts = url.pathname.split("/").filter(Boolean);
										const verifyIndex = parts.indexOf("verify");
										if (verifyIndex !== -1 && parts[verifyIndex + 1]) {
											code = parts[verifyIndex + 1];
										} else {
											code = parts[parts.length - 1] || code;
										}
									} catch {
										// Fallback to as-is
									}
								}

								if (code) {
									toast.success(t("scanQrSuccess"));
									// Stop tracks and navigate
									active = false;
									if (stream) {
										stream.getTracks().forEach((track) => track.stop());
										setStream(null);
									}
									setIsCameraOpen(false);
									router.push(routes.verify.code.page({ code }));
									return;
								}
							}
						}
					}
					animationFrameId = requestAnimationFrame(tick);
				};

				tick();
			} catch (e) {
				console.error("QR Loop initialization failed:", e);
			}
		}

		runLoop();

		return () => {
			active = false;
			cancelAnimationFrame(animationFrameId);
		};
	}, [isCameraOpen, stream, router, t]);

	return (
		<>
			<Card className="w-full">
				<CardContent className="pt-6 flex flex-col gap-6">
					<form.AppForm>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								form.handleSubmit();
							}}
						>
							<FieldGroup>
								<form.AppField
									name="code"
									validators={{
										onChange: z.string().min(1, t("codeRequired")),
										onBlur: z.string().min(1, t("codeRequired")),
									}}
								>
									{(field) => (
										<field.TextField
											label={t("code")}
											placeholder={t("codePlaceholder")}
											autoFocus
											autoComplete="off"
										/>
									)}
								</form.AppField>

								<Field>
									<form.SubmitButton className="w-full">
										{t("verifyButton")}
									</form.SubmitButton>
								</Field>
							</FieldGroup>
						</form>
					</form.AppForm>

					<FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
						{t("scanQrTitle")}
					</FieldSeparator>

					<div className="flex flex-col gap-2">
						{isCameraSupported && (
							<Button
								type="button"
								variant="outline"
								onClick={startCamera}
								className="w-full mb-1 gap-2 h-11"
							>
								<CameraIcon className="size-4" />
								{t("scanWithCamera")}
							</Button>
						)}

						<Dropzone
							onFilesSelected={handleFilesSelected}
							accept="image/*"
							capture="environment"
							disabled={isScanning}
							className="py-10 border-slate-200 dark:border-slate-800"
						>
							<QrCodeIcon className="size-10 text-muted-foreground/60 mb-2" />
							<p className="text-sm font-medium">
								{isScanning ? t("scanQrLoading") : t("scanQrPlaceholder")}
							</p>
						</Dropzone>
					</div>
				</CardContent>
			</Card>

			{/* Camera Dialog */}
			<Dialog
				open={isCameraOpen}
				onOpenChange={(open) => !open && stopCamera()}
			>
				<DialogContent
					className="max-w-md p-6"
					onInteractOutside={(e) => e.preventDefault()}
				>
					<DialogHeader>
						<DialogTitle>{t("scanQrTitle")}</DialogTitle>
					</DialogHeader>

					<div className="relative aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center">
						{isCameraLoading && (
							<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900 text-white z-10">
								<Loader2Icon className="size-8 animate-spin" />
								<p className="text-xs">{t("cameraLoading")}</p>
							</div>
						)}

						<video
							ref={videoRef}
							muted
							playsInline
							className="w-full h-full object-cover"
						/>

						{/* Scanner Reticle overlay */}
						{!isCameraLoading && (
							<div className="absolute inset-0 pointer-events-none flex items-center justify-center">
								<div className="relative w-48 h-48 border-2 border-emerald-500 rounded-lg animate-pulse flex items-center justify-center">
									{/* Scanner horizontal scanning line */}
									<div className="absolute left-0 right-0 h-0.5 bg-emerald-400/80 shadow-md shadow-emerald-400 top-1/2 -translate-y-1/2 animate-[scan_2s_ease-in-out_infinite]" />
								</div>
							</div>
						)}
					</div>

					{/* Hidden canvas for video frame extraction */}
					<canvas ref={canvasRef} className="hidden" />

					<div className="flex justify-end gap-2 mt-4">
						<Button variant="outline" onClick={stopCamera}>
							{t("close")}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
