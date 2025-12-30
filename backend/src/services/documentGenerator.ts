import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';
import PDFDocument from 'pdfkit';

export async function generateInvitation(tender: any, format: 'docx' | 'pdf'): Promise<Buffer> {
  if (format === 'docx') {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'ПРИГЛАШЕНИЕ К УЧАСТИЮ В ТЕНДЕРЕ',
                bold: true,
                size: 32
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Тендер № ${tender.number}`,
                bold: true,
                size: 28
              })
            ],
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: tender.title,
                size: 24
              })
            ],
            spacing: { after: 400 }
          }),
          ...(tender.description ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: tender.description,
                  size: 22
                })
              ],
              spacing: { after: 200 }
            })
          ] : []),
          ...(tender.submission_deadline ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Срок подачи заявок: ${new Date(tender.submission_deadline).toLocaleDateString('ru-RU')}`,
                  size: 22
                })
              ],
              spacing: { after: 200 }
            })
          ] : []),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Приглашаем Вас принять участие в данном тендере.',
                size: 22
              })
            ],
            spacing: { after: 400 }
          })
        ]
      }]
    });

    return await Packer.toBuffer(doc);
  } else {
    // PDF generation
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      doc.fontSize(20).text('ПРИГЛАШЕНИЕ К УЧАСТИЮ В ТЕНДЕРЕ', { align: 'center' });
      doc.moveDown();
      doc.fontSize(16).text(`Тендер № ${tender.number}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(tender.title);
      doc.moveDown();
      
      if (tender.description) {
        doc.text(tender.description);
        doc.moveDown();
      }
      
      if (tender.submission_deadline) {
        doc.text(`Срок подачи заявок: ${new Date(tender.submission_deadline).toLocaleDateString('ru-RU')}`);
        doc.moveDown();
      }
      
      doc.text('Приглашаем Вас принять участие в данном тендере.');
      doc.end();
    });
  }
}

export async function generateQuoteForm(tender: any, lots: any[], format: 'docx' | 'pdf'): Promise<Buffer> {
  if (format === 'docx') {
    const children: any[] = [
      new Paragraph({
        children: [
          new TextRun({
            text: 'ФОРМА КОММЕРЧЕСКОГО ПРЕДЛОЖЕНИЯ',
            bold: true,
            size: 32
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Тендер № ${tender.number}: ${tender.title}`,
            size: 24
          })
        ],
        spacing: { after: 400 }
      })
    ];

    lots.forEach((lot, index) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Лот ${lot.number}: ${lot.title}`,
              bold: true,
              size: 22
            })
          ],
          spacing: { before: 200, after: 200 }
        })
      );

      // Add table for positions
      const tableRows = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph('№')] }),
            new TableCell({ children: [new Paragraph('Наименование')] }),
            new TableCell({ children: [new Paragraph('Ед. изм.')] }),
            new TableCell({ children: [new Paragraph('Количество')] }),
            new TableCell({ children: [new Paragraph('Цена за ед.')] }),
            new TableCell({ children: [new Paragraph('Сумма')] })
          ]
        })
      ];

      children.push(
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE }
        })
      );
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children
      }]
    });

    return await Packer.toBuffer(doc);
  } else {
    // PDF generation
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      doc.fontSize(20).text('ФОРМА КОММЕРЧЕСКОГО ПРЕДЛОЖЕНИЯ', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Тендер № ${tender.number}: ${tender.title}`);
      doc.moveDown();

      lots.forEach((lot) => {
        doc.fontSize(14).text(`Лот ${lot.number}: ${lot.title}`, { underline: true });
        doc.moveDown();
      });

      doc.end();
    });
  }
}

export async function generateProtocol(tender: any, lots: any[], format: 'docx' | 'pdf'): Promise<Buffer> {
  if (format === 'docx') {
    const children: any[] = [
      new Paragraph({
        children: [
          new TextRun({
            text: 'ПРОТОКОЛ РАССМОТРЕНИЯ ЗАЯВОК',
            bold: true,
            size: 32
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Тендер № ${tender.number}: ${tender.title}`,
            size: 24
          })
        ],
        spacing: { after: 400 }
      })
    ];

    lots.forEach((lot) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Лот ${lot.number}: ${lot.title}`,
              bold: true,
              size: 22
            })
          ],
          spacing: { before: 200, after: 200 }
        })
      );

      if (lot.quotes && lot.quotes.length > 0) {
        const tableRows = [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Поставщик')] }),
              new TableCell({ children: [new Paragraph('Сумма')] }),
              new TableCell({ children: [new Paragraph('Срок')] }),
              new TableCell({ children: [new Paragraph('Статус')] })
            ]
          })
        ];

        lot.quotes.forEach((quote: any) => {
          tableRows.push(
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(quote.supplier_name)] }),
                new TableCell({ children: [new Paragraph(String(quote.total_amount || ''))] }),
                new TableCell({ children: [new Paragraph(String(quote.delivery_time_days || ''))] }),
                new TableCell({ children: [new Paragraph(quote.status)] })
              ]
            })
          );
        });

        children.push(
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE }
          })
        );
      }
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children
      }]
    });

    return await Packer.toBuffer(doc);
  } else {
    // PDF generation
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      doc.fontSize(20).text('ПРОТОКОЛ РАССМОТРЕНИЯ ЗАЯВОК', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Тендер № ${tender.number}: ${tender.title}`);
      doc.moveDown();

      lots.forEach((lot) => {
        doc.fontSize(14).text(`Лот ${lot.number}: ${lot.title}`, { underline: true });
        doc.moveDown();
        
        if (lot.quotes && lot.quotes.length > 0) {
          lot.quotes.forEach((quote: any) => {
            doc.fontSize(12).text(`${quote.supplier_name}: ${quote.total_amount || ''} руб.`);
          });
          doc.moveDown();
        }
      });

      doc.end();
    });
  }
}

