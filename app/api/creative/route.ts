import { NextRequest, NextResponse } from 'next/server';
import {
  toggleCreativeWinner,
  updateCreativeStatus,
  updateCreativeMetadata,
  updateCreativeFields,
} from '@/lib/db-update';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, creativeKey, ...params } = body;

    if (!creativeKey) {
      return NextResponse.json(
        { success: false, message: '소재 키가 필요합니다.' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'toggleWinner':
        result = toggleCreativeWinner(creativeKey, params.isWinner);
        break;

      case 'updateStatus':
        result = updateCreativeStatus(creativeKey, params.status);
        break;

      case 'updateMetadata':
        result = updateCreativeMetadata(creativeKey, params.notes, params.tags);
        break;

      case 'updateFields':
        result = updateCreativeFields(creativeKey, params.updates);
        break;

      default:
        return NextResponse.json(
          { success: false, message: '알 수 없는 액션입니다.' },
          { status: 400 }
        );
    }

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
