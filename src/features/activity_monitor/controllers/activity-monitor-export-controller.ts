import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { ExportActivityMonitorInput } from '../validators/activity-monitor-export-validator';
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
 * Export activity monitor data to XLSX format
 */
export const exportActivityMonitorData = async (
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

    const { startDate, endDate, subTypeAnalytic, cctvId, primaryAnalyticsId } =
      validatedData as ExportActivityMonitorInput;

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
    if (subTypeAnalytic && subTypeAnalytic.length > 0) {
      whereClause.sub_type_analytic = {
        in: subTypeAnalytic,
      };
    }

    if (cctvId) {
      whereClause.cctv_id = cctvId;
    }

    if (primaryAnalyticsId) {
      whereClause.primary_analytics_id = primaryAnalyticsId;
    }

    // Fetch data from database with relations
    const activityMonitorData = await prisma.activity_monitoring.findMany({
      where: whereClause,
      orderBy: {
        datetime_send: 'desc',
      },
      include: {
        primary_analytics: {
          select: {
            id: true,
            name: true,
            status: true,
            type_analytic: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        cctv: {
          select: {
            id: true,
            cctv_name: true,
            ip_cctv: true,
            is_active: true,
          },
        },
      },
    });

    if (activityMonitorData.length === 0) {
      sendErrorResponse(
        res,
        'No data found for the specified date range and filters',
        404
      );
      return;
    }

    // Transform data for Excel export with Jakarta timezone
    const excelData = activityMonitorData.map((item, index) => ({
      'No.': index + 1,
      ID: item.id,
      'Sub Type Analytic': item.sub_type_analytic || 'N/A',
      'Primary Analytics ID': item.primary_analytics_id,
      'Primary Analytics Name': item.primary_analytics?.name || 'N/A',
      'Type Analytic': item.primary_analytics?.type_analytic?.name || 'N/A',
      'CCTV ID': item.cctv_id,
      'CCTV Name': item.cctv?.cctv_name || 'N/A',
      'Datetime Send': convertUTCToJakartaForExport(item.datetime_send),
      'Created At': convertUTCToJakartaForExport(item.created_at),
      'Updated At': convertUTCToJakartaForExport(item.updated_at),
    }));

    // Create Excel workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 5 }, // No.
      { wch: 10 }, // ID
      { wch: 20 }, // Sub Type Analytic
      { wch: 15 }, // Primary Analytics ID
      { wch: 25 }, // Primary Analytics Name
      { wch: 20 }, // Type Analytic
      { wch: 10 }, // CCTV ID
      { wch: 25 }, // CCTV Name
      { wch: 25 }, // Datetime Send
      { wch: 25 }, // Created At
      { wch: 25 }, // Updated At
    ];

    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Activity Monitor Data');

    // Generate filename with Jakarta timezone
    const now = new Date();
    const jakartaNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const timestamp = jakartaNow
      .toISOString()
      .replace(/T/, '_')
      .replace(/\..+/, '')
      .replace(/:/g, '-');

    const filename = `activity_monitor_export_${startDate}_to_${endDate}_${timestamp}.xlsx`;

    // Convert workbook to buffer
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });

    // Set response headers for file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    // Send the Excel file
    res.send(excelBuffer);

    console.log('Export completed successfully:', {
      filename,
      recordCount: activityMonitorData.length,
      dateRange: `${startDate} to ${endDate}`,
      filters: { subTypeAnalytic, cctvId, primaryAnalyticsId },
    });
  } catch (error) {
    console.error('Error exporting activity monitor data:', error);
    sendInternalErrorResponse(res);
  }
};
