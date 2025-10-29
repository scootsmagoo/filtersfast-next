import { NextRequest, NextResponse } from 'next/server';
import { getCategoryBySlug, getAllArticles } from '@/lib/db/support';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const category = getCategoryBySlug(slug);

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found',
        },
        { status: 404 }
      );
    }

    // Get articles for this category
    const articles = getAllArticles({
      publishedOnly: true,
      categoryId: category.id,
    });

    return NextResponse.json({
      success: true,
      category,
      articles,
    });
  } catch (error: any) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch category',
      },
      { status: 500 }
    );
  }
}

