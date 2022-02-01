export interface OpenMatchTicket {
  id?: string
  assignment?: OpenMatchTicketAssignment
  search_fields?: OpenMatchSearchFields
  extensions?: OpenMatchExtensions
  create_time?: string
}

type OpenMatchExtensions = Record<string, { type_url: string; value: string }>

interface OpenMatchSearchFields {
  double_args?: Record<string, number>
  string_args?: Record<string, string>
  tags: string[]
}

export interface OpenAPIErrorResponse {
  code: number
  message: string
  details?: [
    {
      type_url: string
      value: string
    }
  ]
}

export type OpenAPIResult<T> = T | OpenAPIErrorResponse

export function isOpenAPIError(response: unknown | OpenAPIErrorResponse): response is OpenAPIErrorResponse {
  const error = response as OpenAPIErrorResponse
  return error && typeof error.code !== 'undefined' && typeof error.message !== 'undefined'
}

export function isOpenMatchTicketAssignmentResponse(
  data: unknown | OpenMatchTicketAssignmentResponse
): data is OpenMatchTicketAssignmentResponse {
  const response = data as any
  return response && typeof response.result !== 'undefined' && isOpenMatchTicketAssignment(response.result.assignment)
}

export function isOpenMatchTicketAssignment(
  data: unknown | OpenMatchTicketAssignment
): data is OpenMatchTicketAssignment {
  const assignment = data as any
  return assignment && typeof assignment.connection === 'string'
}

export interface OpenMatchTicketAssignment {
  connection: string
  extensions?: OpenMatchExtensions
}

export interface MatchmakingTicketAssignment extends OpenMatchTicketAssignment {
  instanceId: string
  locationName: string
}

export interface MatchmakingProfileData {
  mode: string
  team_size: number
}

export interface OpenMatchTicketAssignmentResponse {
  result: {
    assignment: OpenMatchTicketAssignment
  }
}
