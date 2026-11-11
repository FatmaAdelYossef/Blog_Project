using DataAccessLayer.DTOs.Pagenation;

namespace BlogBack.Tests;

public class PaginationParamsTests
{
    [Fact]
    public void Defaults_Are_Page1_Size10()
    {
        var dto = new PaginationParams();
        Assert.Equal(1, dto.PageNumber);
        Assert.Equal(10, dto.PageSize);
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(-5, 1)]
    [InlineData(1, 1)]
    [InlineData(10, 10)]
    [InlineData(11, 10)]
    [InlineData(100, 10)]
    public void PageSize_IsClampedToRange(int input, int expected)
    {
        var dto = new PaginationParams { PageSize = input };
        Assert.Equal(expected, dto.PageSize);
    }
}
