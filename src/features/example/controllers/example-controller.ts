import { Request, Response } from 'express';
import { sendInternalErrorResponse } from '../../../utils/response';
import { exampleSchemaInput } from '../validators/example-validator';
import FormData from 'form-data';
import axios from 'axios';

export const getExampleRoute = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get validated data from middleware
    const exampleData: exampleSchemaInput = (req as any).validatedData;

    //console.log('Validated Data:', exampleData);
    const externalURL =
      'https://reddoorz.sandboxxplore.com/api/product/unique-face-counting';

    const xApiToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiIyOTU2QHNtYXJpZGFzYS53ZWIuaWQiLCJyb2xlIjpbeyJpZCI6MywibmFtZSI6ImFuYWx5dGljc19zZXJ2aWNlIiwiY3JlYXRlZF9hdCI6IjIwMjUtMDQtMTBUMTE6NDM6NDcuMDc3WiIsInVwZGF0ZWRfYXQiOiIyMDI1LTA0LTEwVDExOjQzOjMyLjgyMloifV0sImlhdCI6MTc0NTIyMTgzOH0.2Wnqs23kvfJpBerlo8QAMnAloEsEDQ3D9hn8ggIt1N8';

    // Create form-data instance
    const form = new FormData();

    form.append('primaryAnalyticsId', 3);
    form.append('cctvId', 2);
    form.append('emotion', 'happy');
    form.append('age', null);
    form.append('datetime_send', '2025-09-01 23:00:02');
    form.append('registeredFacesId', '161268993996010482620857959348527233');
    form.append('isRegistered', 'false');
    form.append('imgFace', exampleData.captureImg.buffer, {
      filename: exampleData.captureImg.originalname,
      contentType: exampleData.captureImg.mimetype,
    });

    //console.log(form.getHeaders());

    const response = await axios.post(externalURL, form, {
      headers: {
        'x-api-token': xApiToken,
        ...form.getHeaders(),
        'Content-Type': 'multipart/form-data',
      },
      timeout: 5000,
    });

    console.log('External API response:', response.data);

    res
      .status(200)
      .json({ success: true, message: 'Example route is working!' });
  } catch (error) {
    console.error('Error occurred:', (error as any).response.data);
    sendInternalErrorResponse(res);
  }
};
