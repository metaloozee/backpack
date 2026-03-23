export function GET(
	_: Request,
	{ params: _params }: { params: Promise<{ id: string }> }
) {
	return new Response(null, { status: 204 });
}
