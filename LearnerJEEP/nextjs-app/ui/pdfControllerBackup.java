package com.tamal.pdfReactJava;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.Map;
import java.util.UUID;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

// without upload functionality 

@RestController
@RequestMapping("/api/pdf")
public class PdfController {

    private static final String PDF_DIR = "pdfs/";

    @PostMapping("/create")
    public Map<String, String> createPdf() throws IOException {
        // 1. Ensure the output directory exists
        File directory = new File(PDF_DIR);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        // 2. Generate a unique ID
        String pdfId = UUID.randomUUID().toString();

        // 3. Create and save the new PDF
        PDDocument document = new PDDocument();
        document.addPage(new PDPage());
        File file = new File(directory, pdfId + ".pdf");
        document.save(file);
        document.close();

        // 4. Return the ID to the client
        return Collections.singletonMap("pdfId", pdfId);
    }

    @GetMapping(value = "/{pdfId}", produces = MediaType.APPLICATION_PDF_VALUE)
    public byte[] getPdf(@PathVariable String pdfId) throws IOException {
        File file = new File(PDF_DIR + pdfId + ".pdf");
        return Files.readAllBytes(file.toPath());
    }

    @PostMapping("/{pdfId}/add-text")
    public void addText(
            @PathVariable String pdfId,
            @RequestBody Map<String, String> request
    ) throws IOException {
        String text = request.get("text");
        File file = new File(PDF_DIR + pdfId + ".pdf");
        PDDocument document = PDDocument.load(file);
        PDPage page = document.getPage(0);

        PDPageContentStream contentStream = new PDPageContentStream(
                document,
                page,
                PDPageContentStream.AppendMode.APPEND,
                true
        );
        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA, 12);
        contentStream.newLineAtOffset(100, 700);
        contentStream.showText(text);
        contentStream.endText();
        contentStream.close();

        document.save(file);
        document.close();
    }
}
