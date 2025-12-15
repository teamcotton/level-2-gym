import {
  registerUserApi,
  type RegisterUserData,
} from '../../../infrastructure/api/registerUserApi.js'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterUserData

    // Validate required fields
    if (!body.email || !body.name || !body.password) {
      return Response.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      )
    }

    // Call infrastructure layer to handle the API request
    const result = await registerUserApi(body)

    // Return appropriate status code based on the result
    const statusCode = result.success ? 200 : 400

    return Response.json(result, { status: statusCode })
  } catch (error) {
    console.error('Registration API error:', error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
