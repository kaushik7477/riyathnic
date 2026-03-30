import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, User, Product, Address } from '../../types';

export const downloadInvoice = async (order: Order, user: User, products: Product[]) => {
  const doc = new jsPDF();
  const orderId = (order as any).orderCode || order.id || (order as any)._id;
  const date = new Date(order.createdAt).toLocaleDateString();

  // Load Logo
  try {
    // Attempt to load logo from public assets
    // Since this runs in browser, we can use the relative path
    const logoUrl = '/assets/logo.png';
    doc.addImage(logoUrl, 'PNG', 20, 10, 25, 25);
  } catch (e) {
    console.error("Could not load logo", e);
    // Fallback text if logo fails
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('SOUL STICH', 20, 20);
  }

  // Helper to get address
  const getOrderAddress = (order: Order, user?: User): Address | null => {
    const o: any = order;
    const u: any = user;
    let addr: any;

    if (u?.addresses && u.addresses.length > 0) {
      addr = u.addresses.find((a: any) => a.id === o.addressId || a._id === o.addressId);
    }

    if (!addr) addr = o.address || o.shippingAddress || o.shipping_address;

    if (!addr && o.addressData) {
      try {
        addr = JSON.parse(o.addressData);
      } catch (e) {}
    }

    if (!addr && u?.addresses && u.addresses.length > 0) {
      addr = u.addresses[0];
    }

    if (typeof addr === 'string') {
      try {
        addr = JSON.parse(addr);
      } catch (e) {}
    }

    return addr;
  };

  const address = getOrderAddress(order, user);

  // 1. Header & Brand Identity
  // Logo is already added above at 20, 10
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('soulstich.store@gmail.com', 20, 38);
  doc.text('www.thesoulstich.com', 20, 43);

  doc.setFontSize(24);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 140, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Invoice #: ${orderId}`, 140, 28);
  doc.text(`Date: ${date}`, 140, 33);

  // Line separator
  doc.setDrawColor(200);
  doc.line(20, 48, 190, 48);

  // 2. Details Section (Sold By & Bill To)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('SOLD BY:', 20, 58);
  doc.text('BILL TO:', 110, 58);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.text('Soul Stich', 20, 64);
  
  // Multi-line Address
  const companyAddrLines = [
    'Fortune township, 49/2, jessore road, Kajipara,',
    'Barasat, kolkata - 700125, West Bengal,',
    'North 24 Parganas, 700125'
  ];
  doc.text(companyAddrLines, 20, 69);
  doc.text('GSTIN: 19DTKPK6557A1ZG', 20, 84);

  doc.text(user.name || 'Customer', 110, 64);
  if (address) {
    const addrLine1 = `${address.apartment || ''}, ${address.roadName || ''}`;
    const addrLine2 = `${address.city || ''}, ${address.state || ''} - ${address.pincode || ''}`;
    doc.text(addrLine1, 110, 69);
    doc.text(addrLine2, 110, 74);
    doc.text(`Phone: ${address.phone || user.phone || 'N/A'}`, 110, 79);
  } else {
    doc.text(user.email || 'N/A', 110, 69);
    doc.text(`Phone: ${user.phone || 'N/A'}`, 110, 74);
  }

  // 3. Product Table
  const tableData = order.products.map((p, index) => {
    const product = products.find(prod => (prod.id || (prod as any)._id) === p.productId);
    return [
      index + 1,
      {
        content: `${product?.name || 'T-Shirt With No Details'}\nSKU: ${product?.sku || 'N/A'}\nSize: ${p.size}`,
        styles: { cellPadding: 3 }
      },
      p.size,
      p.quantity,
      `INR ${p.price.toFixed(2)}`,
      `INR ${(p.price * p.quantity).toFixed(2)}`
    ];
  });

  autoTable(doc, {
    startY: 95,
    head: [['#', 'Item Description', 'Size', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 80 },
      2: { cellWidth: 20 },
      3: { cellWidth: 15 },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
    }
  });

  // 4. Financial Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // GST Calculations (5% inclusive)
  // Base = Total / 1.05
  // GST = Total - Base
  const totalAmount = order.totalAmount;
  const baseAmount = totalAmount / 1.05;
  const totalGst = totalAmount - baseAmount;
  const cgst = totalGst / 2;
  const sgst = totalGst / 2;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Payment Method:', 20, finalY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(order.paymentStatus === 'paid' ? 'Prepaid (Razorpay)' : 'Cash on Delivery', 55, finalY);

  // Signatory placeholder
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120);
  doc.text('This is a computer-generated invoice and does not require a signature.', 20, finalY + 15);
  doc.text('Authorized Signatory for Soul Stich', 20, finalY + 20);

  // Financials on the right
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  
  doc.text('Subtotal (Incl. Tax):', 140, finalY);
  doc.text(`INR ${totalAmount.toFixed(2)}`, 185, finalY, { align: 'right' });

  doc.text('Discount:', 140, finalY + 6);
  doc.text((order as any).couponCode ? `-${(order as any).discountAmount || 0} (${(order as any).couponCode})` : 'NO COUPON', 185, finalY + 6, { align: 'right' });

  doc.text('CGST (2.5%):', 140, finalY + 12);
  doc.text(`INR ${cgst.toFixed(2)}`, 185, finalY + 12, { align: 'right' });

  doc.text('SGST (2.5%):', 140, finalY + 18);
  doc.text(`INR ${sgst.toFixed(2)}`, 185, finalY + 18, { align: 'right' });

  doc.text('Shipping:', 140, finalY + 24);
  doc.text('FREE', 185, finalY + 24, { align: 'right' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('Grand Total:', 140, finalY + 34);
  doc.text(`INR ${totalAmount.toFixed(2)}`, 185, finalY + 34, { align: 'right' });

  // 5. Footer & Legal Notes
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150);
  
  doc.text('INSTAGRAM: @soulstichofficial', 105, pageHeight - 55, { align: 'center' });
  doc.text('For return and exchange queries, please visit your order page on our website.', 105, pageHeight - 30, { align: 'center' });
  doc.setFont('helvetica', 'italic');
  doc.text('We’d love to see how you style your new Soul Stich tee! Tag us in your photos for a chance to be featured on our page.', 105, pageHeight - 25, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('Thank you for shopping with Soul Stich! Stay stylish.', 105, pageHeight - 15, { align: 'center' });

  doc.save(`Invoice_SoulStich_${orderId}.pdf`);
};
