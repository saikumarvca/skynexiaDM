import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { assertAdmin, requireUserFromRequest } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireUserFromRequest(request);
    assertAdmin(admin);

    const body = (await request.json()) as { isActive?: boolean };
    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive (boolean) is required' }, { status: 400 });
    }

    await dbConnect();
    const { id } = await params;

    if (!body.isActive && id === admin.userId) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own account' },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: body.isActive },
      { new: true }
    ).select('_id name email role isActive');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHENTICATED')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'FORBIDDEN')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
