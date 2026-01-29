import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { ExportWeaponDetectionInput } from '../validators/weapon-detection-export-validator';
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendInternalErrorResponse,
} from '../../../utils/response';
import {
  convertJakartaDateToUTC,
  convertUTCToJakartaForExport,
  formatDateToJakarta,
} from '../../../utils/date-utils';

const prisma = new PrismaClient();

/**
 * Export weapon detection data to XLSX format
 */
export const exportWeaponDetectionData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get validated data from the validation middleware
    const validatedData = (req as any).validatedQuery;

    if (!validatedData) {
      res.status(400).json({
        success: false,
        message: 'Validation data not found',
      });
      return;
    }

    const { startDate, endDate, weaponType, cctvId, primaryAnalyticsId } =
      validatedData as ExportWeaponDetectionInput;

    // Convert Jakarta timezone dates to UTC for database query
    const startDateUTC = convertJakartaDateToUTC(startDate);
    const endDateUTC = convertJakartaDateToUTC(endDate);

    // Set end date to end of day in Jakarta timezone, then convert to UTC
    const endOfDayJakarta = new Date(endDate + 'T23:59:59+07:00');

    console.log('Export Date Range:', {
      startDateInput: startDate,
      endDateInput: endDate,
      startDateUTC: startDateUTC.toISOString(),
      endDateUTC: endOfDayJakarta.toISOString(),
    });

    // Build where clause for filtering
    const whereClause: any = {
      datetime_send: {
        gte: startDateUTC,
        lte: endOfDayJakarta,
      },
    };

    // Add optional filters
    if (weaponType && weaponType.length > 0) {
      whereClause.weapon_type = {
        in: weaponType,
      };
    }

    if (cctvId) {
      whereClause.cctv_id = cctvId;
    }

    if (primaryAnalyticsId) {
      whereClause.primary_analytics_id = primaryAnalyticsId;
    }

    console.log('Export Where Clause:', JSON.stringify(whereClause, null, 2));

    // Fetch weapon detection data with related information
    const weaponDetections = await prisma.weapon_detection.findMany({
      where: whereClause,
      include: {
        primary_analytics: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        cctv: {
          select: {
            id: true,
            cctv_name: true,
            is_active: true,
          },
        },
      },
      orderBy: {
        datetime_send: 'desc',
      },
    });

    if (weaponDetections.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No weapon detection data found for the specified criteria',
      });
      return;
    }

    // Format data for Excel export
    const excelData = weaponDetections.map((detection, index) => ({
      No: index + 1,
      'Weapon Type': detection.weapon_type,
      Confidence: (detection.confidence * 100).toFixed(2) + '%',
      'CCTV Name': detection.cctv?.cctv_name || 'N/A',
      'CCTV ID': detection.cctv_id,
      'Primary Analytics': detection.primary_analytics?.name || 'N/A',
      'Primary Analytics ID': detection.primary_analytics_id,
      'Detection Time (Jakarta)': formatDateToJakarta(detection.datetime_send),
      'Created At (Jakarta)': formatDateToJakarta(detection.created_at),
      'Updated At (Jakarta)': formatDateToJakarta(detection.updated_at),
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 5 }, // No
      { wch: 15 }, // Weapon Type
      { wch: 12 }, // Confidence
      { wch: 20 }, // CCTV Name
      { wch: 10 }, // CCTV ID
      { wch: 25 }, // Primary Analytics
      { wch: 18 }, // Primary Analytics ID
      { wch: 25 }, // Detection Time
      { wch: 25 }, // Created At
      { wch: 25 }, // Updated At
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Weapon Detection Data');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `weapon_detection_export_${startDate}_to_${endDate}_${timestamp}.xlsx`;

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers for file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    // Send the file
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting weapon detection data:', error);
    sendInternalErrorResponse(res);
  }
};
