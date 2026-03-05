"""
행사 정보 데이터 모델
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class Event(BaseModel):
    """파충류 행사 정보"""
    title: str = Field(..., description="행사명")
    location: Optional[str] = Field(None, description="장소/지역")
    event_date: Optional[datetime] = Field(None, description="행사 날짜")
    event_type: str = Field(..., description="행사 유형 (K렙타일페어, 렙타일포럼, 파동, 밀림페어, KRBC 등)")
    source: str = Field(..., description="출처 (bighorn, pasamo, blog 등)")
    source_url: str = Field(..., description="원본 URL")
    price: Optional[str] = Field(None, description="가격 정보")
    description: Optional[str] = Field(None, description="상세 설명")
    crawled_at: datetime = Field(default_factory=datetime.now, description="크롤링 시각")
    # 빅혼 등: 품절=True(지난 행사), 추천/NEW=False(예정·진행 중). None=미구분(날짜 기준 사용)
    is_sold_out: Optional[bool] = Field(None, description="품절 여부 (True=지난 행사, False=예정/진행)")
