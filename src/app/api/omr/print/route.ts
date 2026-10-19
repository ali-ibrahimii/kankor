import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import {
	BUBBLE_LETTER_FONT_SIZE,
	BUBBLE_LETTER_OFFSET_PT,
	BUBBLE_RADIUS_PT,
	BUBBLE_X_PT,
	FIDUCIAL_POSITIONS_PDF,
	FIDUCIAL_SIZE_PT,
	fromTop,
	HEADER_DIVIDER_FROM_TOP,
	HEADER_SHEET_ID_BASELINE_FROM_TOP,
	HEADER_SHEET_ID_FONT_SIZE,
	HEADER_STUDENT_NAME_BASELINE_FROM_TOP,
	HEADER_STUDENT_NAME_FONT_SIZE,
	HEADER_TITLE_BASELINE_FROM_TOP,
	HEADER_TITLE_FONT_SIZE,
	MARGIN_PT,
	PAGE_HEIGHT_PT,
	PAGE_INDICATOR_BASELINE_FROM_TOP,
	PAGE_INDICATOR_FONT_SIZE,
	PAGE_WIDTH_PT,
	pageCountForQuestions,
	QR_POSITION_PDF,
	QR_SIZE_PT,
	ROW_NUMBER_FONT_SIZE,
	ROW_NUMBER_X_PT,
	ROWS_PER_PAGE,
	rowCenterPdfY,
} from "@/lib/omr/template-geometry";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const quizId = searchParams.get("quiz_id");
	if (!quizId) {
		return Response.json({ error: "quiz_id is required" }, { status: 400 });
	}

	// RLS-respecting client: only actually authorizes reading this quiz's
	// variants if the caller can manage the quiz (owner/admin/school editor).
	const supabase = await createClient();

	const { data: quiz, error: quizError } = await supabase
		.from("quizzes")
		.select("id, title, print_version")
		.eq("id", quizId)
		.single();
	if (quizError || !quiz) {
		return Response.json({ error: "Quiz not found" }, { status: 404 });
	}

	const { data: variants, error: variantsError } = await supabase
		.from("quiz_variants")
		.select("id, student_id, shuffled, template_version, question_order")
		.eq("quiz_id", quizId)
		.eq("template_version", quiz.print_version)
		.order("created_at", { ascending: true });
	if (variantsError) {
		return Response.json({ error: variantsError.message }, { status: 500 });
	}
	if (!variants || variants.length === 0) {
		return Response.json(
			{ error: "No printed variants for this quiz yet" },
			{ status: 404 }
		);
	}

	// Student display names: profiles RLS is self-only, so this needs the
	// service-role client. The authorization decision (can this caller see
	// these variants at all) was already made above via the RLS-respecting
	// client — this step only enriches display text.
	const admin = createServiceRoleClient();
	const studentIds = [...new Set(variants.map((v) => v.student_id))];
	const { data: profiles } = await admin
		.from("profiles")
		.select("id, full_name")
		.in("id", studentIds);
	const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

	const pdfDoc = await PDFDocument.create();
	const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
	const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

	for (const variant of variants) {
		const questionOrder = variant.question_order as string[];
		const questionCount = questionOrder.length;
		const pageCount = pageCountForQuestions(questionCount);
		const studentName = nameById.get(variant.student_id) ?? "";
		const sheetId = `Sheet: ${variant.id.slice(0, 8)}-v${variant.template_version}`;

		const qrPng = await QRCode.toBuffer(variant.id, {
			margin: 0,
			width: QR_SIZE_PT * 4, // render at higher resolution than the pt size for crisp print output
		});
		const qrImage = await pdfDoc.embedPng(qrPng);

		for (let page = 1; page <= pageCount; page++) {
			const pdfPage = pdfDoc.addPage([PAGE_WIDTH_PT, PAGE_HEIGHT_PT]);

			// Fiducials
			for (const pos of Object.values(FIDUCIAL_POSITIONS_PDF)) {
				pdfPage.drawRectangle({
					x: pos.x,
					y: pos.y,
					width: FIDUCIAL_SIZE_PT,
					height: FIDUCIAL_SIZE_PT,
					color: rgb(0, 0, 0),
				});
			}

			// QR code (same variant_id on every page of a multi-page sheet)
			pdfPage.drawImage(qrImage, {
				x: QR_POSITION_PDF.x,
				y: QR_POSITION_PDF.y,
				width: QR_SIZE_PT,
				height: QR_SIZE_PT,
			});

			// Header
			pdfPage.drawText(quiz.title, {
				x: MARGIN_PT,
				y: fromTop(HEADER_TITLE_BASELINE_FROM_TOP),
				size: HEADER_TITLE_FONT_SIZE,
				font: boldFont,
			});
			pdfPage.drawText(sheetId, {
				x: MARGIN_PT,
				y: fromTop(HEADER_SHEET_ID_BASELINE_FROM_TOP),
				size: HEADER_SHEET_ID_FONT_SIZE,
				font,
				color: rgb(0.4, 0.4, 0.4),
			});
			pdfPage.drawText(`Name: ${studentName}`, {
				x: MARGIN_PT,
				y: fromTop(HEADER_STUDENT_NAME_BASELINE_FROM_TOP),
				size: HEADER_STUDENT_NAME_FONT_SIZE,
				font,
			});
			pdfPage.drawLine({
				start: { x: MARGIN_PT, y: fromTop(HEADER_DIVIDER_FROM_TOP) },
				end: {
					x: PAGE_WIDTH_PT - MARGIN_PT,
					y: fromTop(HEADER_DIVIDER_FROM_TOP),
				},
				thickness: 0.5,
				color: rgb(0.7, 0.7, 0.7),
			});

			if (pageCount > 1) {
				pdfPage.drawText(`Page ${page} of ${pageCount}`, {
					x: QR_POSITION_PDF.x,
					y: fromTop(PAGE_INDICATOR_BASELINE_FROM_TOP),
					size: PAGE_INDICATOR_FONT_SIZE,
					font,
					color: rgb(0.4, 0.4, 0.4),
				});
			}

			// Question grid for this page
			const firstIndexOnPage = (page - 1) * ROWS_PER_PAGE;
			const rowsOnThisPage = Math.min(
				ROWS_PER_PAGE,
				questionCount - firstIndexOnPage
			);

			for (let rowOnPage = 1; rowOnPage <= rowsOnThisPage; rowOnPage++) {
				const absoluteIndex = firstIndexOnPage + rowOnPage; // 1-indexed
				const centerY = rowCenterPdfY(rowOnPage);

				pdfPage.drawText(`${absoluteIndex}.`, {
					x: ROW_NUMBER_X_PT,
					y: centerY - 4,
					size: ROW_NUMBER_FONT_SIZE,
					font,
				});

				const optionLetters = ["A", "B", "C", "D"];
				for (let opt = 0; opt < 4; opt++) {
					const cx = BUBBLE_X_PT[opt];
					pdfPage.drawEllipse({
						x: cx,
						y: centerY,
						xScale: BUBBLE_RADIUS_PT,
						yScale: BUBBLE_RADIUS_PT,
						borderColor: rgb(0, 0, 0),
						borderWidth: 1,
					});
					const letterWidth = font.widthOfTextAtSize(
						optionLetters[opt],
						BUBBLE_LETTER_FONT_SIZE
					);
					pdfPage.drawText(optionLetters[opt], {
						x: cx - letterWidth / 2,
						y: centerY + BUBBLE_LETTER_OFFSET_PT,
						size: BUBBLE_LETTER_FONT_SIZE,
						font,
						color: rgb(0.3, 0.3, 0.3),
					});
				}
			}
		}
	}

	const pdfBytes = await pdfDoc.save();

	return new Response(new Uint8Array(pdfBytes), {
		headers: {
			"Content-Type": "application/pdf",
			"Content-Disposition": `inline; filename="${quiz.title.replace(/[^a-z0-9]+/gi, "-")}-v${quiz.print_version}.pdf"`,
		},
	});
}
