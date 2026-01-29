import { Request, Response, NextFunction } from 'express';
import { AnalyticsValidationService } from '../services/validations/analytics-validation';
import { sendErrorResponse } from '../utils/response';

export const validatePrimaryAnalyticsAndCCTVConnection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { primaryAnalyticsId, cctvId } = (req as any).validatedData;

    await AnalyticsValidationService.validatePrimaryAnalytics(
      primaryAnalyticsId
    );
    await AnalyticsValidationService.validateCctv(cctvId);
    await AnalyticsValidationService.validateCctvPrimaryAnalyticsConnection(
      cctvId,
      primaryAnalyticsId
    );

    next();
  } catch (error) {
    sendErrorResponse(res, (error as Error).message, 404);
  }
};

export const validatePrimaryAnalyticsAndCCTVConnectionQuery = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { primaryAnalyticsId, cctvId, startDate, endDate } = req.query;

    // Validate that both parameters are provided
    if (!primaryAnalyticsId || !cctvId) {
      return sendErrorResponse(
        res,
        'primaryAnalyticsId and cctvId are required in query parameters',
        400
      );
    }

    // Validate date parameters
    if (!startDate || !endDate) {
      return sendErrorResponse(
        res,
        'startDate and endDate are required in query parameters',
        400
      );
    }

    // Convert to numbers and validate they are valid numbers
    const primaryAnalyticsIdNum = parseInt(primaryAnalyticsId as string, 10);
    const cctvIdNum = parseInt(cctvId as string, 10);

    if (isNaN(primaryAnalyticsIdNum) || isNaN(cctvIdNum)) {
      return sendErrorResponse(
        res,
        'primaryAnalyticsId and cctvId must be valid numbers',
        400
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (
      !dateRegex.test(startDate as string) ||
      !dateRegex.test(endDate as string)
    ) {
      return sendErrorResponse(
        res,
        'startDate and endDate must be in YYYY-MM-DD format',
        400
      );
    }

    // Validate that dates are valid
    const startDateObj = new Date(startDate as string);
    const endDateObj = new Date(endDate as string);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return sendErrorResponse(
        res,
        'startDate and endDate must be valid dates',
        400
      );
    }

    // Validate that startDate is not after endDate
    if (startDateObj > endDateObj) {
      return sendErrorResponse(res, 'startDate cannot be after endDate', 400);
    }

    // Validate using the existing validation service
    await AnalyticsValidationService.validatePrimaryAnalytics(
      primaryAnalyticsIdNum
    );
    await AnalyticsValidationService.validateCctv(cctvIdNum);
    await AnalyticsValidationService.validateCctvPrimaryAnalyticsConnection(
      cctvIdNum,
      primaryAnalyticsIdNum
    );

    // Store validated data in request for use in controller
    (req as any).validatedQueryData = {
      primaryAnalyticsId: primaryAnalyticsIdNum,
      cctvId: cctvIdNum,
      startDate: startDate as string,
      endDate: endDate as string,
    };

    next();
  } catch (error) {
    sendErrorResponse(res, (error as Error).message, 404);
  }
};

export const validatePrimaryAnalyticsAndCCTVConnectionQuerySimple = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { primaryAnalyticsId, cctvId } = req.query;

    // Validate that both parameters are provided
    if (!primaryAnalyticsId || !cctvId) {
      return sendErrorResponse(
        res,
        'primaryAnalyticsId and cctvId are required in query parameters',
        400
      );
    }

    // Convert to numbers and validate they are valid numbers
    const primaryAnalyticsIdNum = parseInt(primaryAnalyticsId as string, 10);
    const cctvIdNum = parseInt(cctvId as string, 10);

    if (isNaN(primaryAnalyticsIdNum) || isNaN(cctvIdNum)) {
      return sendErrorResponse(
        res,
        'primaryAnalyticsId and cctvId must be valid numbers',
        400
      );
    }

    // Validate using the existing validation service
    await AnalyticsValidationService.validatePrimaryAnalytics(
      primaryAnalyticsIdNum
    );
    await AnalyticsValidationService.validateCctv(cctvIdNum);
    await AnalyticsValidationService.validateCctvPrimaryAnalyticsConnection(
      cctvIdNum,
      primaryAnalyticsIdNum
    );

    // Store validated data in request for use in controller
    (req as any).validatedQueryData = {
      primaryAnalyticsId: primaryAnalyticsIdNum,
      cctvId: cctvIdNum,
    };

    next();
  } catch (error) {
    sendErrorResponse(res, (error as Error).message, 404);
  }
};

export const validateMultiplePrimaryAnalyticsAndCCTVConnection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      cctvId,
      moneyPrimaryAnalyticsId,
      idCardPrimaryAnalyticsId,
      keyRoomPrimaryAnalyticsId,
      formPrimaryAnalyticsId,
    } = req.query;

    // Validate that cctvId is provided
    if (!cctvId) {
      return sendErrorResponse(
        res,
        'cctvId is required in query parameters',
        400
      );
    }

    // At least one primaryAnalyticsId should be provided
    if (
      !moneyPrimaryAnalyticsId &&
      !idCardPrimaryAnalyticsId &&
      !keyRoomPrimaryAnalyticsId &&
      !formPrimaryAnalyticsId
    ) {
      return sendErrorResponse(
        res,
        'At least one primaryAnalyticsId (moneyPrimaryAnalyticsId, idCardPrimaryAnalyticsId, keyRoomPrimaryAnalyticsId, or formPrimaryAnalyticsId) is required in query parameters',
        400
      );
    }

    // Convert cctvId to number and validate
    const cctvIdNum = parseInt(cctvId as string, 10);
    if (isNaN(cctvIdNum)) {
      return sendErrorResponse(res, 'cctvId must be a valid number', 400);
    }

    // Convert and validate primaryAnalyticsIds
    const validatedIds: any = { cctvId: cctvIdNum };

    if (moneyPrimaryAnalyticsId) {
      const moneyId = parseInt(moneyPrimaryAnalyticsId as string, 10);
      if (isNaN(moneyId)) {
        return sendErrorResponse(
          res,
          'moneyPrimaryAnalyticsId must be a valid number',
          400
        );
      }
      validatedIds.moneyPrimaryAnalyticsId = moneyId;
    }

    if (idCardPrimaryAnalyticsId) {
      const idCardId = parseInt(idCardPrimaryAnalyticsId as string, 10);
      if (isNaN(idCardId)) {
        return sendErrorResponse(
          res,
          'idCardPrimaryAnalyticsId must be a valid number',
          400
        );
      }
      validatedIds.idCardPrimaryAnalyticsId = idCardId;
    }

    if (keyRoomPrimaryAnalyticsId) {
      const keyRoomId = parseInt(keyRoomPrimaryAnalyticsId as string, 10);
      if (isNaN(keyRoomId)) {
        return sendErrorResponse(
          res,
          'keyRoomPrimaryAnalyticsId must be a valid number',
          400
        );
      }
      validatedIds.keyRoomPrimaryAnalyticsId = keyRoomId;
    }

    if (formPrimaryAnalyticsId) {
      const formId = parseInt(formPrimaryAnalyticsId as string, 10);
      if (isNaN(formId)) {
        return sendErrorResponse(
          res,
          'formPrimaryAnalyticsId must be a valid number',
          400
        );
      }
      validatedIds.formPrimaryAnalyticsId = formId;
    }

    // Validate CCTV exists
    await AnalyticsValidationService.validateCctv(cctvIdNum);

    // Validate each provided primaryAnalyticsId and its connection to CCTV
    if (validatedIds.moneyPrimaryAnalyticsId) {
      await AnalyticsValidationService.validatePrimaryAnalytics(
        validatedIds.moneyPrimaryAnalyticsId
      );
      await AnalyticsValidationService.validateCctvPrimaryAnalyticsConnection(
        cctvIdNum,
        validatedIds.moneyPrimaryAnalyticsId
      );
    }

    if (validatedIds.idCardPrimaryAnalyticsId) {
      await AnalyticsValidationService.validatePrimaryAnalytics(
        validatedIds.idCardPrimaryAnalyticsId
      );
      await AnalyticsValidationService.validateCctvPrimaryAnalyticsConnection(
        cctvIdNum,
        validatedIds.idCardPrimaryAnalyticsId
      );
    }

    if (validatedIds.keyRoomPrimaryAnalyticsId) {
      await AnalyticsValidationService.validatePrimaryAnalytics(
        validatedIds.keyRoomPrimaryAnalyticsId
      );
      await AnalyticsValidationService.validateCctvPrimaryAnalyticsConnection(
        cctvIdNum,
        validatedIds.keyRoomPrimaryAnalyticsId
      );
    }

    if (validatedIds.formPrimaryAnalyticsId) {
      await AnalyticsValidationService.validatePrimaryAnalytics(
        validatedIds.formPrimaryAnalyticsId
      );
      await AnalyticsValidationService.validateCctvPrimaryAnalyticsConnection(
        cctvIdNum,
        validatedIds.formPrimaryAnalyticsId
      );
    }

    // Store validated data in request for use in controller
    (req as any).validatedQueryData = validatedIds;

    next();
  } catch (error) {
    sendErrorResponse(res, (error as Error).message, 404);
  }
};

export const validateMultiplePrimaryAnalyticsAndCCTVConnectionWithDates =
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        cctvId,
        moneyPrimaryAnalyticsId,
        idCardPrimaryAnalyticsId,
        keyRoomPrimaryAnalyticsId,
        formPrimaryAnalyticsId,
        startDate,
        endDate,
      } = req.query;

      // Validate that cctvId is provided
      if (!cctvId) {
        return sendErrorResponse(
          res,
          'cctvId is required in query parameters',
          400
        );
      }

      // Validate date parameters
      if (!startDate || !endDate) {
        return sendErrorResponse(
          res,
          'startDate and endDate are required in query parameters',
          400
        );
      }

      // At least one primaryAnalyticsId should be provided
      if (
        !moneyPrimaryAnalyticsId &&
        !idCardPrimaryAnalyticsId &&
        !keyRoomPrimaryAnalyticsId &&
        !formPrimaryAnalyticsId
      ) {
        return sendErrorResponse(
          res,
          'At least one primaryAnalyticsId (moneyPrimaryAnalyticsId, idCardPrimaryAnalyticsId, keyRoomPrimaryAnalyticsId, or formPrimaryAnalyticsId) is required in query parameters',
          400
        );
      }

      // Convert cctvId to number and validate
      const cctvIdNum = parseInt(cctvId as string, 10);
      if (isNaN(cctvIdNum)) {
        return sendErrorResponse(res, 'cctvId must be a valid number', 400);
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (
        !dateRegex.test(startDate as string) ||
        !dateRegex.test(endDate as string)
      ) {
        return sendErrorResponse(
          res,
          'startDate and endDate must be in YYYY-MM-DD format',
          400
        );
      }

      // Validate that dates are valid
      const startDateObj = new Date(startDate as string);
      const endDateObj = new Date(endDate as string);

      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        return sendErrorResponse(
          res,
          'startDate and endDate must be valid dates',
          400
        );
      }

      // Validate that startDate is not after endDate
      if (startDateObj > endDateObj) {
        return sendErrorResponse(res, 'startDate cannot be after endDate', 400);
      }

      // Convert and validate primaryAnalyticsIds
      const validatedIds: any = {
        cctvId: cctvIdNum,
        startDate: startDate as string,
        endDate: endDate as string,
      };

      if (moneyPrimaryAnalyticsId) {
        const moneyId = parseInt(moneyPrimaryAnalyticsId as string, 10);
        if (isNaN(moneyId)) {
          return sendErrorResponse(
            res,
            'moneyPrimaryAnalyticsId must be a valid number',
            400
          );
        }
        validatedIds.moneyPrimaryAnalyticsId = moneyId;
      }

      if (idCardPrimaryAnalyticsId) {
        const idCardId = parseInt(idCardPrimaryAnalyticsId as string, 10);
        if (isNaN(idCardId)) {
          return sendErrorResponse(
            res,
            'idCardPrimaryAnalyticsId must be a valid number',
            400
          );
        }
        validatedIds.idCardPrimaryAnalyticsId = idCardId;
      }

      if (keyRoomPrimaryAnalyticsId) {
        const keyRoomId = parseInt(keyRoomPrimaryAnalyticsId as string, 10);
        if (isNaN(keyRoomId)) {
          return sendErrorResponse(
            res,
            'keyRoomPrimaryAnalyticsId must be a valid number',
            400
          );
        }
        validatedIds.keyRoomPrimaryAnalyticsId = keyRoomId;
      }

      if (formPrimaryAnalyticsId) {
        const formId = parseInt(formPrimaryAnalyticsId as string, 10);
        if (isNaN(formId)) {
          return sendErrorResponse(
            res,
            'formPrimaryAnalyticsId must be a valid number',
            400
          );
        }
        validatedIds.formPrimaryAnalyticsId = formId;
      }

      // Validate CCTV exists
      await AnalyticsValidationService.validateCctv(cctvIdNum);

      // Validate each provided primaryAnalyticsId and its connection to CCTV
      if (validatedIds.moneyPrimaryAnalyticsId) {
        await AnalyticsValidationService.validatePrimaryAnalytics(
          validatedIds.moneyPrimaryAnalyticsId
        );
        await AnalyticsValidationService.validateCctvPrimaryAnalyticsConnection(
          cctvIdNum,
          validatedIds.moneyPrimaryAnalyticsId
        );
      }

      if (validatedIds.idCardPrimaryAnalyticsId) {
        await AnalyticsValidationService.validatePrimaryAnalytics(
          validatedIds.idCardPrimaryAnalyticsId
        );
        await AnalyticsValidationService.validateCctvPrimaryAnalyticsConnection(
          cctvIdNum,
          validatedIds.idCardPrimaryAnalyticsId
        );
      }

      if (validatedIds.keyRoomPrimaryAnalyticsId) {
        await AnalyticsValidationService.validatePrimaryAnalytics(
          validatedIds.keyRoomPrimaryAnalyticsId
        );
        await AnalyticsValidationService.validateCctvPrimaryAnalyticsConnection(
          cctvIdNum,
          validatedIds.keyRoomPrimaryAnalyticsId
        );
      }

      if (validatedIds.formPrimaryAnalyticsId) {
        await AnalyticsValidationService.validatePrimaryAnalytics(
          validatedIds.formPrimaryAnalyticsId
        );
        await AnalyticsValidationService.validateCctvPrimaryAnalyticsConnection(
          cctvIdNum,
          validatedIds.formPrimaryAnalyticsId
        );
      }

      // Store validated data in request for use in controller
      (req as any).validatedQueryData = validatedIds;

      next();
    } catch (error) {
      sendErrorResponse(res, (error as Error).message, 404);
    }
  };
