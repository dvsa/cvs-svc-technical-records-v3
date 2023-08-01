describe('search function', () => {
  it('should find a record', async () => {
    const response = await fetch('http:/127.0.0.1:3000/v3/technical-records/search/DP76UMK4DQLTOT?searchCriteria=vin');
    expect(response.status).toBe(200);
    expect(response.body).toBeTruthy();
  });
});
