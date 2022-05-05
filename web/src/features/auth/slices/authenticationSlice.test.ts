import { decodeRoles } from 'features/auth/slices/authenticationSlice'

describe('authenticationSlice', () => {
  it('should return all roles of a user from a token', () => {
    const token =
      'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJQZUlFYlpQUm5xaTk2ZDl6RFJZT3B5RFBqVHdkei1tcF9kRHJPYmJ4Uko0In0.eyJleHAiOjE2NDk0NTYyMDksImlhdCI6MTY0OTQ1NDQwOSwiYXV0aF90aW1lIjoxNjQ5NDQ3Njg4LCJqdGkiOiI5OGMxZDM1ZC1lYWU4LTQzNTItOWE0Yy04ZTk3ZWY4NTJmMWUiLCJpc3MiOiJodHRwczovL2Rldi5vaWRjLmdvdi5iYy5jYS9hdXRoL3JlYWxtcy84d2w2eDRjcCIsInN1YiI6ImQ4MWI3MTkwLTUzMmItNDNhYi05Y2ZmLWZlOThjMGJlNjNhZSIsInR5cCI6IkJlYXJlciIsImF6cCI6Indwcy13ZWIiLCJub25jZSI6IjIxMWM3NjgzLTQ2M2EtNDMwNC04NThlLWNmYjA0MzA0MjhlMSIsInNlc3Npb25fc3RhdGUiOiIwMGJmNTQ0Mi0yNjliLTQ5MTYtOTAyOS1iMTllMmUyNDM0MmUiLCJhY3IiOiIwIiwiYWxsb3dlZC1vcmlnaW5zIjpbIioiXSwicmVzb3VyY2VfYWNjZXNzIjp7Indwcy13ZWIiOnsicm9sZXMiOlsiaGZpX3NlbGVjdF9zdGF0aW9uIiwidGVzdC1yb2xlIiwiaGZpX3NldF9maXJlX3N0YXJ0cyJdfX0sInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm5hbWUiOiJDb25vciBCcmFkeSIsInByZWZlcnJlZF91c2VybmFtZSI6ImNicmFkeUBpZGlyIiwiZ2l2ZW5fbmFtZSI6IkNvbm9yIiwiZmFtaWx5X25hbWUiOiJCcmFkeSIsImVtYWlsIjoiY29ub3IuYnJhZHlAZ292LmJjLmNhIn0.gmJyQqjqtmxwj-eD57cN2_om_5J8GsDlCyeFcEueTMtc_JhKxJDgH90LVUQ0HizdZObpid61cjUJnogb6gyPrzJgesb2FEZaMd88ACU9akbHvYhe4TrBjDPGev5XE9SdMpag8vbVsNa4JIUn6KQxUDhJw8a_olTsqunTT5KKdrPSQyCExk6nDFGE2lZqgDUDIszbpLkzv7xV9T9MOoWeVDJSQvfw3aH4ZXUZ26rxt4RQGDJTInHO6M91zwWPc6Gi0KPxMNv7DG7eyJ8FWg1e8WeptZ6gdcKFgGEIY8lih2TdmeP40gzti1KpBXbMVwLavlXbS46wHgXQTbm-2CW6mQ'

    const roles = decodeRoles(token)

    expect(roles).toEqual(['hfi_select_station', 'test-role', 'hfi_set_fire_starts'])
  })
  it('should return no roles if user token has none defined', () => {
    const token =
      'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJQZUlFYlpQUm5xaTk2ZDl6RFJZT3B5RFBqVHdkei1tcF9kRHJPYmJ4Uko0In0.eyJleHAiOjE2NDk0NjEwMzAsImlhdCI6MTY0OTQ1OTIzMCwiYXV0aF90aW1lIjoxNjQ5NDQ3Njg4LCJqdGkiOiI2Y2IyYTE3Yi1kZTFiLTQ0ZGMtYTFiYy1jODkxM2RiZDYyYmEiLCJpc3MiOiJodHRwczovL2Rldi5vaWRjLmdvdi5iYy5jYS9hdXRoL3JlYWxtcy84d2w2eDRjcCIsInN1YiI6ImQ4MWI3MTkwLTUzMmItNDNhYi05Y2ZmLWZlOThjMGJlNjNhZSIsInR5cCI6IkJlYXJlciIsImF6cCI6Indwcy13ZWIiLCJub25jZSI6ImZmNWI2MjZkLWU3NDktNGM2Yi1iYjk3LWQzOTY0M2MwYzlkYiIsInNlc3Npb25fc3RhdGUiOiIwMGJmNTQ0Mi0yNjliLTQ5MTYtOTAyOS1iMTllMmUyNDM0MmUiLCJhY3IiOiIwIiwiYWxsb3dlZC1vcmlnaW5zIjpbIioiXSwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwibmFtZSI6IkNvbm9yIEJyYWR5IiwicHJlZmVycmVkX3VzZXJuYW1lIjoiY2JyYWR5QGlkaXIiLCJnaXZlbl9uYW1lIjoiQ29ub3IiLCJmYW1pbHlfbmFtZSI6IkJyYWR5IiwiZW1haWwiOiJjb25vci5icmFkeUBnb3YuYmMuY2EifQ.eZulBMmLH1QC7p3OOfurV9g0Y1smy29OqULT_JIAx7zeUydaOBIFrsRUbIdZJXqsgtgxlrvFML3sATUfpUj-ujwMTQDE9EZkwT6N_XCrSFD7-jY_-CsiyxofudH_JVEqe98etmSYFFjDf7mxX2smD8s_a7k5exuUJR9Ub9DWIkRXFFsfXKJzJdwpLLmC7ffC2V71PYP9GMRjx4JR2bBdPUyjTP4xQ-dicxAV9w5-EOOPMI79lUQjALi9hlvCWhmBaAmcP5WSlJFvpPvECz3yAON-B_qUJprGATWAbcUEqnxVvyS8I38KfVbkm8WOUPR6FRVhx7s0q_Rq3qwmDDlsXw'
    const roles = decodeRoles(token)
    expect(roles).toEqual([])
  })
})